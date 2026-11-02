'use strict';

const {
  CommerceError,
  requireAuth,
  requireString,
  normalizeShareCode,
  parseStrictInteger,
  readStoredCoins,
  sha256,
  snapshotData,
} = require('./util');

const SHARE_CLAIM_LEASE_MS = 120000;
const MAX_RETRY_QUANTITY = 10;
const CHECKOUT_SESSION_PATTERN = /^cs_[A-Za-z0-9_]+$/;
const SHARE_CODE_HASH_PATTERN = /^[a-f0-9]{64}$/;

function shareClaimDecision({ claim, recipientUid, nowMs, leaseMs = SHARE_CLAIM_LEASE_MS }) {
  if (!claim) return { action: 'create' };
  if (claim.status === 'redeemed') return { action: 'error', reason: 'share-code-redeemed' };
  if (claim.status === 'expired') {
    return claim.recipientUid === recipientUid
      ? { action: 'acquire' }
      : { action: 'error', reason: 'share-code-reserved' };
  }
  if (claim.status === 'failed') return { action: 'create' };
  if (claim.status === 'reserved') {
    if (typeof claim.sessionId !== 'string' || claim.recipientUid !== recipientUid) {
      return { action: 'error', reason: 'share-code-reserved' };
    }
    const expiresAtMs = typeof claim.expiresAtMs === 'number' && Number.isFinite(claim.expiresAtMs)
      ? claim.expiresAtMs
      : null;
    if (expiresAtMs === null || expiresAtMs > nowMs) {
      return { action: 'reuse', sessionId: claim.sessionId };
    }
    if (expiresAtMs <= nowMs) {
      return claim.recipientUid === recipientUid
        ? { action: 'acquire' }
        : { action: 'error', reason: 'share-code-expired' };
    }
  }
  if (claim.status === 'creating') {
    const startedAtMs = typeof claim.startedAtMs === 'number' && Number.isFinite(claim.startedAtMs)
      ? claim.startedAtMs
      : null;
    if (startedAtMs === null) return { action: 'error', reason: 'share-code-in-progress' };
    if (startedAtMs + leaseMs > nowMs) {
      return claim.recipientUid === recipientUid
        ? { action: 'error', reason: 'share-code-in-progress' }
        : { action: 'error', reason: 'share-code-reserved' };
    }
    return { action: 'acquire' };
  }
  return { action: 'error', reason: 'share-code-invalid' };
}

async function getPriceProductId(stripe, priceId) {
  const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
  const product = price && price.product;
  const productId = typeof product === 'string' ? product : product && product.id;
  if (typeof productId !== 'string' || !productId) {
    throw new CommerceError('failed-precondition', 'Retry product is not configured correctly', 503);
  }
  return productId;
}

async function listPromotionCodes(stripe, code) {
  const result = await stripe.promotionCodes.list({ code, active: true, limit: 1, expand: ['data.coupon'] });
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  return [];
}

async function resolveSharePromo({ stripe, code, recipientUid, productId, nowMs }) {
  const candidates = [...new Set([code, code.toUpperCase()])];
  let promo = null;
  for (const candidate of candidates) {
    const matches = await listPromotionCodes(stripe, candidate);
    promo = matches.find((item) => item && typeof item.code === 'string' && item.code.toUpperCase() === code.toUpperCase()) || null;
    if (promo) break;
  }
  if (!promo) {
    throw new CommerceError('failed-precondition', 'share-code-invalid', 412, { reason: 'share-code-invalid' });
  }
  if (promo.active === false) {
    throw new CommerceError('failed-precondition', 'share-code-inactive', 412, { reason: 'share-code-inactive' });
  }
  const expiresAtMs = Number.isFinite(promo.expires_at) ? promo.expires_at * 1000 : null;
  if (expiresAtMs === null || expiresAtMs <= nowMs) {
    throw new CommerceError('failed-precondition', 'share-code-expired', 412, { reason: 'share-code-expired' });
  }
  if (promo.max_redemptions !== 1) {
    throw new CommerceError('failed-precondition', 'share-code-invalid', 412, { reason: 'share-code-not-single-use' });
  }
  const timesRedeemed = Number.isSafeInteger(promo.times_redeemed) ? promo.times_redeemed : 0;
  if (timesRedeemed > 0) {
    throw new CommerceError('failed-precondition', 'share-code-redeemed', 412, { reason: 'share-code-redeemed' });
  }
  const issuerUid = promo.metadata && promo.metadata.uid;
  if (typeof issuerUid !== 'string' || !issuerUid) {
    throw new CommerceError('failed-precondition', 'share-code-invalid', 412, { reason: 'share-code-missing-issuer' });
  }
  if (issuerUid === recipientUid) {
    throw new CommerceError('failed-precondition', 'share-code-self', 412, { reason: 'share-code-self' });
  }
  if (!promo.metadata || promo.metadata.product !== 'truthle_retry_share') {
    throw new CommerceError('failed-precondition', 'share-code-wrong-product', 412, { reason: 'share-code-wrong-product' });
  }
  let coupon = promo.coupon;
  if (typeof coupon === 'string') coupon = await stripe.coupons.retrieve(coupon, { expand: ['applies_to'] });
  if (!coupon || coupon.valid === false) {
    throw new CommerceError('failed-precondition', 'share-code-invalid', 412, { reason: 'share-code-coupon-invalid' });
  }
  if (coupon.percent_off !== 100 || coupon.duration !== 'once') {
    throw new CommerceError('failed-precondition', 'share-code-wrong-discount', 412, { reason: 'share-code-wrong-discount' });
  }
  if (!coupon.metadata || coupon.metadata.product !== 'truthle_retry_share') {
    throw new CommerceError('failed-precondition', 'share-code-wrong-product', 412, { reason: 'share-code-wrong-product' });
  }
  const products = coupon.applies_to && Array.isArray(coupon.applies_to.products)
    ? coupon.applies_to.products
    : [];
  if (!products.includes(productId)) {
    throw new CommerceError('failed-precondition', 'share-code-wrong-product', 412, { reason: 'share-code-wrong-product' });
  }
  return {
    promotionCodeId: promo.id,
    code: promo.code || code,
    codeHash: sha256((promo.code || code).toUpperCase()),
    issuerUid,
    expiresAtMs,
  };
}

function createCheckoutSessionParams({ uid, priceId, quantity, returnPath, siteUrl, share }) {
  const params = {
    mode: 'payment',
    line_items: [{ price: priceId, quantity }],
    allow_promotion_codes: false,
    currency: 'eur',
    adaptive_pricing: { enabled: false },
    client_reference_id: uid,
    metadata: { uid, product: 'truthle_retry', quantity: String(quantity) },
    payment_intent_data: { metadata: { uid, product: 'truthle_retry' } },
    success_url: `${siteUrl}${returnPath}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${returnPath}?checkout=cancel`,
  };
  if (share) {
    params.discounts = [{ promotion_code: share.promotionCodeId }];
    params.metadata.shareCodeHash = share.codeHash;
  }
  return params;
}

function createCreateCheckoutHandler(options) {
  const {
    db,
    stripe,
    priceId,
    siteUrl,
    now = () => new Date(),
    maxQuantity = MAX_RETRY_QUANTITY,
    shareClaimLeaseMs = SHARE_CLAIM_LEASE_MS,
  } = options;
  let productIdCache = null;

  return async function createTruthleRetryCheckout(data, context) {
    const uid = requireAuth(context);
    if (!priceId) {
      throw new CommerceError('failed-precondition', 'Payments are not configured yet', 503);
    }
    const input = data || {};
    const quantity = parseStrictInteger(input.quantity, 'quantity', { min: 1, max: maxQuantity, defaultValue: 1 });
    const returnPath = input.returnTo === 'true-false' ? '/true-false/' : '/truthle/';
    const nowDate = now();
    const nowMs = nowDate.getTime();

    let share = null;
    if (input.shareCode !== undefined && input.shareCode !== null && input.shareCode !== '') {
      if (quantity !== 1) {
        throw new CommerceError('invalid-argument', 'share-code-requires-quantity-1', 400);
      }
      const code = normalizeShareCode(input.shareCode);
      if (!productIdCache) productIdCache = await getPriceProductId(stripe, priceId);
      share = await resolveSharePromo({ stripe, code, recipientUid: uid, productId: productIdCache, nowMs });
    }

    if (!share) {
      const params = createCheckoutSessionParams({ uid, priceId, quantity, returnPath, siteUrl });
      let session;
      try {
        session = await stripe.checkout.sessions.create(params);
      } catch (error) {
        throw new CommerceError('unavailable', 'Checkout unavailable', 503);
      }
      await db.collection('stripe_checkout_sessions').doc(session.id).set({
        uid,
        quantity,
        product: 'truthle_retry',
        status: 'created',
        createdAt: nowDate,
      });
      return { url: session.url, id: session.id };
    }

    const claimRef = db.collection('truthle_share_claims').doc(`sc_${share.codeHash}`);
    const reservation = await db.runTransaction(async (transaction) => {
      const claimSnap = await transaction.get(claimRef);
      const claim = snapshotData(claimSnap);
      const decision = shareClaimDecision({ claim, recipientUid: uid, nowMs, leaseMs: shareClaimLeaseMs });
      if (decision.action === 'error') {
        throw new CommerceError('failed-precondition', decision.reason, decision.reason === 'share-code-in-progress' ? 409 : 412, { reason: decision.reason });
      }
      if (decision.action === 'reuse') return { reuseSessionId: decision.sessionId };
      transaction.set(claimRef, {
        codeHash: share.codeHash,
        product: 'truthle_retry_share',
        recipientUid: uid,
        issuerUid: share.issuerUid,
        status: 'creating',
        startedAtMs: nowMs,
        attempt: Number.isSafeInteger(claim && claim.attempt) ? claim.attempt + 1 : 1,
        updatedAt: nowDate,
      }, { merge: true });
      return { reserved: true };
    });

    if (reservation.reuseSessionId) {
      let existing = null;
      try {
        existing = await stripe.checkout.sessions.retrieve(reservation.reuseSessionId);
      } catch (error) {
        throw new CommerceError('unavailable', 'Checkout status unavailable', 503);
      }
      if (!existing || existing.status === 'expired') {
        if (existing && existing.status === 'expired') {
          await db.runTransaction(async (transaction) => {
            const claimSnap = await transaction.get(claimRef);
            const claim = snapshotData(claimSnap);
            if (claim && claim.status === 'reserved' && claim.sessionId === existing.id) {
              transaction.set(claimRef, { status: 'expired', expiredAt: nowDate, updatedAt: nowDate }, { merge: true });
            }
          });
        }
        throw new CommerceError('failed-precondition', 'share-code-expired', 412, { reason: 'share-code-expired' });
      }
      return { url: existing.url, id: existing.id };
    }

    let session;
    try {
      const params = createCheckoutSessionParams({ uid, priceId, quantity: 1, returnPath, siteUrl, share });
      session = await stripe.checkout.sessions.create(params);
    } catch (error) {
      await db.runTransaction(async (transaction) => {
        const claimSnap = await transaction.get(claimRef);
        const claim = snapshotData(claimSnap);
        if (claim && claim.status === 'creating' && claim.recipientUid === uid) {
          transaction.set(claimRef, { status: 'failed', failedAt: nowDate, updatedAt: nowDate }, { merge: true });
        }
      }).catch(() => {});
      throw new CommerceError('unavailable', 'Checkout unavailable', 503);
    }

    const sessionExpiryMs = Number.isFinite(session.expires_at) ? session.expires_at * 1000 : share.expiresAtMs;
    const expiresAtMs = Math.min(sessionExpiryMs, share.expiresAtMs);
    await db.runTransaction(async (transaction) => {
      const claimSnap = await transaction.get(claimRef);
      const claim = snapshotData(claimSnap);
      if (!claim || claim.status !== 'creating' || claim.recipientUid !== uid) {
        throw new CommerceError('aborted', 'share-code-claim-changed', 409);
      }
      const priorSessionIds = Array.isArray(claim.sessionIds)
        ? claim.sessionIds.filter((value) => typeof value === 'string')
        : [];
      const sessionIds = [...new Set([
        ...priorSessionIds,
        ...(typeof claim.sessionId === 'string' ? [claim.sessionId] : []),
        session.id,
      ])];
      transaction.set(claimRef, {
        status: 'reserved',
        sessionId: session.id,
        sessionIds,
        expiresAtMs,
        reservedAt: nowDate,
        updatedAt: nowDate,
      }, { merge: true });
      transaction.set(db.collection('stripe_checkout_sessions').doc(session.id), {
        uid,
        quantity: 1,
        product: 'truthle_retry',
        status: 'created',
        shareCodeHash: share.codeHash,
        createdAt: nowDate,
      }, { merge: true });
    });

    return { url: session.url, id: session.id };
  };
}

function createGetCheckoutStatusHandler(options) {
  const { db, stripe, now = () => new Date() } = options;

  return async function getTruthleCheckoutStatus(data, context) {
    const uid = requireAuth(context);
    const sessionId = requireString(data && data.sessionId, 'sessionId', {
      min: 5,
      max: 255,
      pattern: CHECKOUT_SESSION_PATTERN,
      patternMessage: 'sessionId is invalid',
    });
    const localRef = db.collection('stripe_checkout_sessions').doc(sessionId);
    const grantRef = db.collection('stripe_retry_grants').doc(sessionId);
    const [localSnap, grantSnap] = await Promise.all([localRef.get(), grantRef.get()]);
    const local = snapshotData(localSnap);
    const grant = snapshotData(grantSnap);

    if (local && local.uid !== uid) {
      throw new CommerceError('permission-denied', 'Checkout session belongs to another user', 403);
    }
    if (grant && grant.uid !== uid) {
      throw new CommerceError('permission-denied', 'Checkout session belongs to another user', 403);
    }
    if (grant) {
      return { status: 'fulfilled', credits: readStoredCoins(grant.credits, 'grant credits') };
    }
    if (local && local.status === 'expired') return { status: 'expired', credits: 0 };
    if (local && local.status === 'failed') return { status: 'failed', credits: 0 };

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (error) {
      if (!local) throw new CommerceError('not-found', 'Checkout session not found', 404);
      return { status: 'pending', credits: 0 };
    }

    const owner = session.client_reference_id || (session.metadata && session.metadata.uid);
    if (owner !== uid) {
      throw new CommerceError('permission-denied', 'Checkout session belongs to another user', 403);
    }
    if (!session.metadata || session.metadata.product !== 'truthle_retry') {
      throw new CommerceError('failed-precondition', 'Not a retry checkout session', 412);
    }
    if (session.metadata.shareCodeHash && session.metadata.quantity !== '1') {
      return { status: 'failed', credits: 0 };
    }
    if (session.status === 'expired') return { status: 'expired', credits: 0 };
    if (Number.isFinite(session.expires_at) && session.expires_at * 1000 <= now().getTime() && session.status !== 'complete') {
      return { status: 'expired', credits: 0 };
    }
    if (session.status === 'complete' && session.payment_status === 'unpaid') {
      return { status: 'failed', credits: 0 };
    }
    return { status: 'pending', credits: 0 };
  };
}

async function grantPaidRetriesForSession({ db, session, eventId, now = () => new Date() }) {
  if (!session || !session.metadata || session.metadata.product !== 'truthle_retry') return 'ignored';
  if (typeof session.id !== 'string' || !CHECKOUT_SESSION_PATTERN.test(session.id)) return 'invalid_session';
  const rawShareCodeHash = session.metadata.shareCodeHash;
  if (rawShareCodeHash !== undefined && rawShareCodeHash !== null && rawShareCodeHash !== ''
      && (typeof rawShareCodeHash !== 'string' || !SHARE_CODE_HASH_PATTERN.test(rawShareCodeHash))) {
    return 'invalid_share_code';
  }
  const shareCodeHash = typeof rawShareCodeHash === 'string' && rawShareCodeHash ? rawShareCodeHash : null;
  const freeCheckout = session.payment_status === 'no_payment_required'
    && session.amount_total === 0
    && shareCodeHash !== null;
  if (session.payment_status !== 'paid' && !freeCheckout) return 'unpaid';
  const referenceUid = session.client_reference_id;
  const metadataUid = session.metadata.uid;
  if (typeof referenceUid === 'string' && typeof metadataUid === 'string' && referenceUid !== metadataUid) {
    return 'uid_mismatch';
  }
  const uid = referenceUid || metadataUid;
  if (typeof uid !== 'string' || !uid) return 'no_uid';

  let quantity;
  try {
    quantity = parseStrictInteger(session.metadata.quantity, 'quantity', { min: 1, max: MAX_RETRY_QUANTITY, defaultValue: 1 });
  } catch (error) {
    return 'invalid_quantity';
  }
  if (shareCodeHash && quantity !== 1) return 'invalid_quantity';
  const credits = quantity;
  const grantRef = db.collection('stripe_retry_grants').doc(session.id);
  const paidRef = db.collection('truthle_paid_retries').doc(uid);
  const localRef = db.collection('stripe_checkout_sessions').doc(session.id);
  const claimRef = shareCodeHash ? db.collection('truthle_share_claims').doc(`sc_${shareCodeHash}`) : null;
  const nowDate = now();

  return db.runTransaction(async (transaction) => {
    const grantSnap = await transaction.get(grantRef);
    if (grantSnap.exists) return 'duplicate';
    let claim = null;
    if (claimRef) {
      const claimSnap = await transaction.get(claimRef);
      claim = snapshotData(claimSnap);
      const claimStatus = claim && claim.status;
      const allowedSession = claim && (claim.sessionId === session.id
        || (Array.isArray(claim.sessionIds) && claim.sessionIds.includes(session.id)));
      if (!claim || (claimStatus !== 'reserved' && claimStatus !== 'expired')
          || !allowedSession || claim.recipientUid !== uid
          || claim.codeHash !== shareCodeHash || claim.product !== 'truthle_retry_share'
          || claim.issuerUid === uid) {
        throw new CommerceError('failed-precondition', 'share-claim-mismatch', 409);
      }
    }
    const paidSnap = await transaction.get(paidRef);
    const paid = snapshotData(paidSnap) || {};
    const currentCredits = readStoredCoins(paid.credits, 'paid retry credits');
    const purchasedTotal = readStoredCoins(paid.purchasedTotal, 'purchased retry credits');

    transaction.set(grantRef, {
      uid,
      credits,
      eventId,
      product: 'truthle_retry',
      amountTotal: session.amount_total === undefined ? null : session.amount_total,
      currency: session.currency || null,
      shareCodeHash,
      grantedAt: nowDate,
    });
    transaction.set(paidRef, {
      credits: currentCredits + credits,
      purchasedTotal: purchasedTotal + credits,
      updatedAt: nowDate,
    }, { merge: true });
    transaction.set(localRef, {
      status: 'fulfilled',
      fulfilledAt: nowDate,
      updatedAt: nowDate,
    }, { merge: true });
    if (claimRef) {
      transaction.set(claimRef, {
        status: 'redeemed',
        redeemedAt: nowDate,
        sessionId: session.id,
        grantId: session.id,
        updatedAt: nowDate,
      }, { merge: true });
    }
    return 'granted';
  });
}

async function markCheckoutExpired({ db, session, now = () => new Date() }) {
  if (!session || typeof session.id !== 'string') return 'ignored';
  const localRef = db.collection('stripe_checkout_sessions').doc(session.id);
  const rawShareCodeHash = session.metadata && session.metadata.shareCodeHash;
  const shareCodeHash = typeof rawShareCodeHash === 'string' && SHARE_CODE_HASH_PATTERN.test(rawShareCodeHash)
    ? session.metadata.shareCodeHash
    : null;
  const claimRef = shareCodeHash ? db.collection('truthle_share_claims').doc(`sc_${shareCodeHash}`) : null;
  const nowDate = now();
  return db.runTransaction(async (transaction) => {
    const localSnap = await transaction.get(localRef);
    const local = snapshotData(localSnap);
    const claimSnap = claimRef ? await transaction.get(claimRef) : null;
    const claim = claimSnap ? snapshotData(claimSnap) : null;

    if (local && local.status !== 'fulfilled') {
      transaction.set(localRef, { status: 'expired', expiredAt: nowDate, updatedAt: nowDate }, { merge: true });
    }
    if (claim && claim.status === 'reserved' && claim.sessionId === session.id) {
      transaction.set(claimRef, { status: 'expired', expiredAt: nowDate, updatedAt: nowDate }, { merge: true });
    }
    return 'expired';
  });
}

function createStripeWebhookHandler(options) {
  const { db, stripe, webhookSecret, now = () => new Date(), onError = null } = options;

  return async function stripeWebhook(request) {
    if (request.method !== 'POST') return { status: 405, body: 'Method not allowed' };
    if (!webhookSecret) return { status: 503, body: 'Not configured' };
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        request.rawBody,
        request.headers && request.headers['stripe-signature'],
        webhookSecret,
      );
    } catch (error) {
      return { status: 400, body: 'Bad signature' };
    }

    try {
      if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
        await grantPaidRetriesForSession({ db, session: event.data.object, eventId: event.id, now });
      } else if (event.type === 'checkout.session.expired') {
        await markCheckoutExpired({ db, session: event.data.object, now });
      }
      return { status: 200, body: { received: true } };
    } catch (error) {
      if (typeof onError === 'function') {
        try {
          onError(error);
        } catch (observerError) {
          // Error observers must not affect webhook acknowledgement.
        }
      }
      return { status: 500, body: 'Internal error' };
    }
  };
}

module.exports = {
  SHARE_CLAIM_LEASE_MS,
  shareClaimDecision,
  resolveSharePromo,
  createCreateCheckoutHandler,
  createGetCheckoutStatusHandler,
  createStripeWebhookHandler,
  grantPaidRetriesForSession,
  markCheckoutExpired,
};
