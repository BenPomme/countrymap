'use strict';

const crypto = require('crypto');
const {
  CommerceError,
  requireAuth,
  requireString,
  sha256,
  snapshotData,
  utcDateKey,
} = require('./util');

const UNSUBSCRIBE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;
const UNSUBSCRIBE_TOKEN_HASH_PATTERN = /^[a-f0-9]{64}$/;

function requireTrustedUnsubscribeBaseUrl(value) {
  const raw = typeof value === 'string' ? value.trim() : '';
  let baseUrl;
  try {
    baseUrl = new URL(raw);
  } catch (error) {
    throw new CommerceError('failed-precondition', 'Reminder unsubscribe URL is not configured correctly', 503);
  }

  if (
    baseUrl.protocol !== 'https:' ||
    baseUrl.username ||
    baseUrl.password ||
    baseUrl.search ||
    baseUrl.hash
  ) {
    throw new CommerceError('failed-precondition', 'Reminder unsubscribe URL is not configured correctly', 503);
  }
  return baseUrl;
}

function buildUnsubscribeUrl(baseUrl, token) {
  const url = new URL(baseUrl.toString());
  url.searchParams.set('token', token);
  return url.toString();
}

function defaultTokenFactory() {
  return crypto.randomBytes(32).toString('base64url');
}

function unsubscribeTokenHash(token) {
  return sha256(token);
}

function unsubscribeTokenId(token) {
  return `ut_${unsubscribeTokenHash(token)}`;
}

function tokenRecordIdFromHash(hash) {
  return `ut_${hash}`;
}

function requireUnsubscribeToken(value) {
  return requireString(value, 'token', {
    min: 32,
    max: 128,
    pattern: UNSUBSCRIBE_TOKEN_PATTERN,
    patternMessage: 'Unsubscribe token is invalid',
  });
}

async function findActiveUnsubscribeToken({ transaction, db, subscriber }) {
  const hash = subscriber && subscriber.unsubscribeTokenHash;
  if (typeof hash !== 'string' || !UNSUBSCRIBE_TOKEN_HASH_PATTERN.test(hash)) return null;
  const tokenSnap = await transaction.get(db.collection('email_unsubscribe_tokens').doc(tokenRecordIdFromHash(hash)));
  const record = snapshotData(tokenSnap);
  if (!record || record.status !== 'active' || record.tokenHash !== hash) return null;
  if (typeof record.token !== 'string' || !UNSUBSCRIBE_TOKEN_PATTERN.test(record.token)) return null;
  if (unsubscribeTokenHash(record.token) !== hash) return null;
  return { token: record.token, hash };
}

async function ensureUnsubscribeToken({
  transaction,
  db,
  subscriber,
  uid,
  now,
  makeToken = defaultTokenFactory,
}) {
  const existing = await findActiveUnsubscribeToken({ transaction, db, subscriber });
  if (existing) return existing;

  const token = makeToken();
  if (typeof token !== 'string' || !UNSUBSCRIBE_TOKEN_PATTERN.test(token)) {
    throw new CommerceError('internal', 'Could not create unsubscribe token', 500);
  }
  const hash = unsubscribeTokenHash(token);
  const tokenRef = db.collection('email_unsubscribe_tokens').doc(tokenRecordIdFromHash(hash));
  transaction.set(tokenRef, {
    uid,
    token,
    tokenHash: hash,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  });
  return { token, hash };
}

function createGetEmailPreferencesHandler(options) {
  const { db } = options;

  return async function getEmailPreferences(data, context) {
    const uid = requireAuth(context);
    const subscriberSnap = await db.collection('email_subscribers').doc(uid).get();
    const subscriber = snapshotData(subscriberSnap);
    if (!subscriber) return { enabled: false, email: null };
    return {
      enabled: subscriber.enabled === true,
      email: typeof subscriber.email === 'string' ? subscriber.email : null,
    };
  };
}

function createUpdateEmailPreferencesHandler(options) {
  const { db, now = () => new Date(), makeToken = defaultTokenFactory } = options;

  return async function updateEmailPreferences(data, context) {
    const uid = requireAuth(context);
    const input = data || {};
    if (typeof input.enabled !== 'boolean') {
      throw new CommerceError('invalid-argument', 'enabled must be a boolean', 400);
    }
    const tokenEmail = context.auth.token && context.auth.token.email;
    const email = typeof tokenEmail === 'string' ? tokenEmail.trim() : '';
    if (input.enabled && (email.length < 3 || email.length > 320 || !email.includes('@'))) {
      throw new CommerceError('failed-precondition', 'A verified account email is required', 412);
    }

    const nowDate = now();
    const subscriberRef = db.collection('email_subscribers').doc(uid);
    return db.runTransaction(async (transaction) => {
      const subscriberSnap = await transaction.get(subscriberRef);
      const existing = snapshotData(subscriberSnap) || {};
      let token = null;
      let tokenHash = typeof existing.unsubscribeTokenHash === 'string' ? existing.unsubscribeTokenHash : null;

      if (input.enabled) {
        const tokenInfo = await ensureUnsubscribeToken({
          transaction,
          db,
          subscriber: existing,
          uid,
          now: nowDate,
          makeToken,
        });
        token = tokenInfo.token;
        tokenHash = tokenInfo.hash;
      }

      const nextEmail = email || (typeof existing.email === 'string' ? existing.email : null);
      const update = {
        enabled: input.enabled,
        updatedAt: nowDate,
      };
      if (nextEmail) update.email = nextEmail;
      if (tokenHash) update.unsubscribeTokenHash = tokenHash;
      if (!input.enabled) update.unsubscribedAt = nowDate;
      transaction.set(subscriberRef, update, { merge: true });

      return {
        success: true,
        enabled: input.enabled,
        unsubscribeToken: token,
      };
    });
  };
}

function createUnsubscribeRemindersHandler(options) {
  const { db, now = () => new Date() } = options;

  return async function unsubscribeReminders(data) {
    const token = requireUnsubscribeToken(data && data.token);
    const hash = unsubscribeTokenHash(token);
    const tokenRef = db.collection('email_unsubscribe_tokens').doc(tokenRecordIdFromHash(hash));
    const nowDate = now();

    return db.runTransaction(async (transaction) => {
      const tokenSnap = await transaction.get(tokenRef);
      const tokenRecord = snapshotData(tokenSnap);
      if (!tokenRecord || tokenRecord.tokenHash !== hash) {
        throw new CommerceError('not-found', 'Unsubscribe link is invalid', 404);
      }
      if (tokenRecord.status !== 'active' && tokenRecord.status !== 'used') {
        throw new CommerceError('failed-precondition', 'Unsubscribe link is invalid', 412);
      }
      const uid = tokenRecord.uid;
      if (typeof uid !== 'string' || uid.length < 1) {
        throw new CommerceError('failed-precondition', 'Unsubscribe link is invalid', 412);
      }

      const subscriberRef = db.collection('email_subscribers').doc(uid);
      const subscriberSnap = await transaction.get(subscriberRef);
      const subscriber = snapshotData(subscriberSnap);
      const alreadyUnsubscribed = tokenRecord.status === 'used' || (subscriber && subscriber.enabled === false);

      if (tokenRecord.status === 'active') {
        transaction.set(tokenRef, { status: 'used', usedAt: nowDate, updatedAt: nowDate }, { merge: true });
      }
      if (subscriber && subscriber.enabled !== false) {
        transaction.set(subscriberRef, {
          enabled: false,
          unsubscribedAt: nowDate,
          updatedAt: nowDate,
        }, { merge: true });
      }

      return { success: true, alreadyUnsubscribed: Boolean(alreadyUnsubscribed) };
    });
  };
}

function createUnsubscribeRemindersHttpHandler(options) {
  const { unsubscribe } = options;
  if (typeof unsubscribe !== 'function') {
    throw new TypeError('unsubscribe handler is required');
  }

  return async function unsubscribeRemindersHttp(request) {
    if (!request || request.method !== 'GET') {
      return { status: 405, body: 'Method not allowed' };
    }

    try {
      await unsubscribe({ token: request.query && request.query.token }, {});
      return { status: 200, body: 'Reminder preferences updated.' };
    } catch (error) {
      return {
        status: error instanceof CommerceError ? error.httpStatus : 400,
        body: 'Unsubscribe link is invalid.',
      };
    }
  };
}

function createQueueDailyRemindersHandler(options) {
  const {
    db,
    enabled = false,
    unsubscribeBaseUrl,
    now = () => new Date(),
    makeToken = defaultTokenFactory,
  } = options;

  return async function queueDailyReminders() {
    const nowDate = now();
    const day = utcDateKey(nowDate);
    if (!enabled) return { enabled: false, queued: 0, skipped: 0 };

    const trustedUnsubscribeBaseUrl = requireTrustedUnsubscribeBaseUrl(unsubscribeBaseUrl);
    const subscribers = await db.collection('email_subscribers').where('enabled', '==', true).get();
    let queued = 0;
    let skipped = 0;

    for (const doc of subscribers.docs) {
      const uid = doc.id;
      const baseSubscriber = doc.data();
      if (typeof uid !== 'string' || !uid || typeof baseSubscriber.email !== 'string' || !baseSubscriber.email) {
        skipped += 1;
        continue;
      }

      const receiptRef = db.collection('mail_delivery_receipts').doc(`rmd_${sha256(`${uid}\0${day}`)}`);
      const mailRef = db.collection('mail').doc(`rm_${sha256(`${uid}\0${day}`)}`);
      const playedRef = db.collection('truthle').doc('daily').collection(day).doc(uid);

      const outcome = await db.runTransaction(async (transaction) => {
        const receiptSnap = await transaction.get(receiptRef);
        if (receiptSnap.exists) return 'duplicate';
        const playedSnap = await transaction.get(playedRef);
        if (playedSnap.exists) return 'played';

        const subscriberRef = db.collection('email_subscribers').doc(uid);
        const subscriberSnap = await transaction.get(subscriberRef);
        const subscriber = snapshotData(subscriberSnap);
        if (!subscriber || subscriber.enabled !== true || typeof subscriber.email !== 'string' || !subscriber.email) {
          return 'disabled';
        }

        const tokenInfo = await ensureUnsubscribeToken({
          transaction,
          db,
          subscriber,
          uid,
          now: nowDate,
          makeToken,
        });
        transaction.set(subscriberRef, { unsubscribeTokenHash: tokenInfo.hash }, { merge: true });
        transaction.set(receiptRef, {
          uid,
          day,
          queueId: mailRef.id,
          status: 'queued',
          queuedAt: nowDate,
        });
        transaction.set(mailRef, {
          to: subscriber.email,
          createdAt: nowDate,
          template: {
            name: 'truthle_daily_reminder',
            data: {
              truthleDay: day,
              playUrl: 'https://theworldtruth.com/truthle/',
              unsubscribeUrl: buildUnsubscribeUrl(trustedUnsubscribeBaseUrl, tokenInfo.token),
            },
          },
        });
        return 'queued';
      });

      if (outcome === 'queued') queued += 1;
      else skipped += 1;
    }

    return { enabled: true, queued, skipped };
  };
}

module.exports = {
  UNSUBSCRIBE_TOKEN_PATTERN,
  defaultTokenFactory,
  unsubscribeTokenHash,
  unsubscribeTokenId,
  createGetEmailPreferencesHandler,
  createUpdateEmailPreferencesHandler,
  createUnsubscribeRemindersHandler,
  createUnsubscribeRemindersHttpHandler,
  createQueueDailyRemindersHandler,
};
