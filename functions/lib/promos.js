'use strict';

const crypto = require('crypto');
const {
  CommerceError,
  endOfUtcDay,
  requireAuth,
  sha256,
  snapshotData,
  utcDateKey,
} = require('./util');

const SHARE_RESERVATION_LEASE_MS = 30000;
const SHARE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomShareCode() {
  const bytes = crypto.randomBytes(10);
  let suffix = '';
  for (const byte of bytes) suffix += SHARE_CODE_ALPHABET[byte % SHARE_CODE_ALPHABET.length];
  return `WT-${suffix}`;
}

function idempotencyKey(uid, day, attempt) {
  return `truthle-share-${sha256(`${uid}\0${day}\0${attempt}`).slice(0, 48)}`;
}

function providerCodeExists(error) {
  return error && (error.code === 'resource_already_exists' || /already exists/i.test(error.message || ''));
}

async function findShareCoupon(stripe) {
  for await (const coupon of stripe.coupons.list({ limit: 100 })) {
    if (coupon && coupon.valid !== false && coupon.metadata && coupon.metadata.product === 'truthle_retry_share') {
      return coupon.id;
    }
  }
  return null;
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

async function getShareCouponId({ stripe, priceId, configuredCouponId }) {
  if (configuredCouponId) return configuredCouponId;
  const existing = await findShareCoupon(stripe);
  if (existing) return existing;
  const productId = await getPriceProductId(stripe, priceId);
  const coupon = await stripe.coupons.create({
    percent_off: 100,
    duration: 'once',
    name: 'Truthle Extra Attempt share gift',
    applies_to: { products: [productId] },
    metadata: { product: 'truthle_retry_share' },
  }, { idempotencyKey: 'truthle-share-coupon-v1' });
  return coupon.id;
}

function createMintSharePromoHandler(options) {
  const {
    db,
    stripe,
    priceId,
    configuredCouponId = '',
    now = () => new Date(),
    leaseMs = SHARE_RESERVATION_LEASE_MS,
  } = options;
  let couponIdCache = configuredCouponId || null;

  return async function mintTruthleSharePromo(data, context) {
    const uid = requireAuth(context);
    if (!stripe || !priceId) {
      throw new CommerceError('failed-precondition', 'Payments are not configured yet', 503);
    }
    let deviceKey = null;
    if (data && data.deviceKey !== undefined && data.deviceKey !== null) {
      if (typeof data.deviceKey !== 'string' || data.deviceKey.length > 64) {
        throw new CommerceError('invalid-argument', 'deviceKey is invalid', 400);
      }
      deviceKey = data.deviceKey;
    }

    const nowDate = now();
    const nowMs = nowDate.getTime();
    const day = utcDateKey(nowDate);
    const expiresAtDate = endOfUtcDay(nowDate);
    const expiresAt = expiresAtDate.toISOString();
    const ref = db.collection('truthle_share_promos').doc(`${uid}_${day}`);

    const reservation = await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(ref);
      const existing = snapshotData(snap);
      if (existing && existing.code) {
        return { existing: true, code: existing.code, expiresAt: existing.expiresAt };
      }
      if (existing && existing.status === 'minting') {
        const startedAtMs = typeof existing.startedAtMs === 'number' && Number.isFinite(existing.startedAtMs)
          ? existing.startedAtMs
          : 0;
        if (startedAtMs + leaseMs > nowMs) {
          throw new CommerceError('aborted', 'Code is being generated', 409, { reason: 'mint-in-progress' });
        }
      }

      const recovering = existing && existing.status === 'minting' && existing.candidateCode;
      const attempt = recovering && Number.isSafeInteger(existing.attempt) ? existing.attempt : 1;
      const candidateCode = recovering ? existing.candidateCode : randomShareCode();
      const providerIdempotencyKey = recovering && existing.providerIdempotencyKey
        ? existing.providerIdempotencyKey
        : idempotencyKey(uid, day, attempt);
      transaction.set(ref, {
        uid,
        day,
        deviceKey,
        status: 'minting',
        startedAtMs: nowMs,
        attempt,
        candidateCode,
        providerIdempotencyKey,
        createdAt: existing && existing.createdAt ? existing.createdAt : nowDate,
        updatedAt: nowDate,
      }, { merge: true });
      return { candidateCode, providerIdempotencyKey, attempt };
    });

    if (reservation.existing) {
      return { code: reservation.code, expiresAt: reservation.expiresAt };
    }

    try {
      if (!couponIdCache) {
        couponIdCache = await getShareCouponId({ stripe, priceId, configuredCouponId });
      }
      let promo = null;
      let candidateCode = reservation.candidateCode;
      let providerIdempotencyKey = reservation.providerIdempotencyKey;

      for (let tryNumber = 0; tryNumber < 2 && !promo; tryNumber += 1) {
        try {
          promo = await stripe.promotionCodes.create({
            coupon: couponIdCache,
            code: candidateCode,
            max_redemptions: 1,
            expires_at: Math.floor(expiresAtDate.getTime() / 1000),
            metadata: { uid, day, product: 'truthle_retry_share' },
          }, { idempotencyKey: providerIdempotencyKey });
        } catch (error) {
          if (!providerCodeExists(error)) throw error;
          const matches = await stripe.promotionCodes.list({ code: candidateCode, active: true, limit: 1 });
          const rows = matches && Array.isArray(matches.data) ? matches.data : [];
          promo = rows.find((item) => item && item.code === candidateCode && item.metadata
            && item.metadata.uid === uid && item.metadata.day === day
            && item.metadata.product === 'truthle_retry_share') || null;
          if (!promo && tryNumber === 0) {
            candidateCode = randomShareCode();
            providerIdempotencyKey = idempotencyKey(uid, day, reservation.attempt + 1);
          }
        }
      }
      if (!promo) throw new CommerceError('internal', 'Could not allocate share code', 500);

      await ref.set({
        status: 'minted',
        code: promo.code,
        promoId: promo.id,
        couponId: couponIdCache,
        expiresAt,
        mintedAt: nowDate,
        updatedAt: nowDate,
        candidateCode: promo.code,
      }, { merge: true });
      return { code: promo.code, expiresAt };
    } catch (error) {
      await ref.set({
        status: 'failed',
        failedAt: nowDate,
        updatedAt: nowDate,
      }, { merge: true }).catch(() => {});
      if (error instanceof CommerceError) throw error;
      throw new CommerceError('internal', 'Could not create friend code', 500);
    }
  };
}

module.exports = {
  SHARE_RESERVATION_LEASE_MS,
  createMintSharePromoHandler,
  getPriceProductId,
  getShareCouponId,
};
