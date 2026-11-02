'use strict';

const {
  CommerceError,
  requireAuth,
  requireRequestId,
  parseStrictInteger,
  readStoredCoins,
  sha256,
  snapshotData,
  utcDateKey,
} = require('./util');

const RETRY_ATTEMPT_RESULTS = 5;

function retryEntitlementId(dateKey, uid) {
  return `${dateKey}_${uid}`;
}

function retryReceiptId(uid, requestId) {
  return `rr_${sha256(`${uid}\0${requestId}`)}`;
}

function legacyReceiptId(uid, date) {
  return `lr_${sha256(`${uid}\0${date}`)}`;
}

function optionalRequestId(data) {
  if (!data || data.requestId === undefined || data.requestId === null || data.requestId === '') return null;
  return requireRequestId(data.requestId);
}

function readReceiptResult(receipt) {
  return {
    success: receipt.success === true,
    source: receipt.source === 'paid' ? 'paid' : 'free',
    remainingRetries: readStoredCoins(receipt.remainingRetries, 'receipt retries'),
    receiptId: receipt.receiptId,
  };
}

function createGetRetryStatusHandler(options) {
  const { db, now = () => new Date() } = options;

  return async function getTruthleRetryStatus(data, context) {
    const uid = requireAuth(context);
    const date = utcDateKey(now());
    const [entitlementSnap, paidSnap] = await Promise.all([
      db.collection('truthle_retry_entitlements').doc(retryEntitlementId(date, uid)).get(),
      db.collection('truthle_paid_retries').doc(uid).get(),
    ]);
    const entitlement = snapshotData(entitlementSnap) || {};
    const paid = snapshotData(paidSnap) || {};
    const paidCredits = readStoredCoins(paid.credits, 'paid retry credits');
    const granted = entitlement.granted === true;
    const consumed = entitlement.consumed === true;

    return {
      date,
      granted,
      consumed,
      paidCredits,
      canConsume: (granted && !consumed) || paidCredits > 0,
      source: entitlementSnap.exists || paidSnap.exists ? 'backend' : 'none',
    };
  };
}

function createConsumeRetryHandler(options) {
  const { db, now = () => new Date() } = options;

  return async function consumeTruthleRetry(data, context) {
    const uid = requireAuth(context);
    const requestId = optionalRequestId(data);
    const nowDate = now();
    const date = utcDateKey(nowDate);
    const entitlementRef = db.collection('truthle_retry_entitlements').doc(retryEntitlementId(date, uid));
    const paidRef = db.collection('truthle_paid_retries').doc(uid);
    const receiptId = requestId ? retryReceiptId(uid, requestId) : legacyReceiptId(uid, date);
    const receiptRef = db.collection('truthle_retry_receipts').doc(receiptId);

    return db.runTransaction(async (transaction) => {
      const receiptSnap = await transaction.get(receiptRef);
      const receipt = snapshotData(receiptSnap);
      if (receipt) {
        if (receipt.uid !== uid || receipt.status !== 'success') {
          throw new CommerceError('failed-precondition', 'Retry receipt is unavailable', 409);
        }
        return readReceiptResult(receipt);
      }

      const entitlementSnap = await transaction.get(entitlementRef);
      const paidSnap = await transaction.get(paidRef);
      const entitlement = snapshotData(entitlementSnap) || {};
      const paid = snapshotData(paidSnap) || {};
      const paidCredits = readStoredCoins(paid.credits, 'paid retry credits');
      const freeAvailable = entitlement.granted === true && entitlement.consumed !== true;

      let source;
      let remainingRetries;
      if (freeAvailable) {
        source = 'free';
        remainingRetries = paidCredits;
        transaction.set(entitlementRef, {
          consumed: true,
          consumedAt: nowDate,
          consumedRequestIdHash: requestId ? sha256(requestId) : null,
          updatedAt: nowDate,
        }, { merge: true });
      } else {
        if (!requestId) {
          throw new CommerceError('failed-precondition', 'Request ID required for paid retry', 409, {
            reason: 'request-id-required',
          });
        }
        if (paidCredits < 1) {
          throw new CommerceError('failed-precondition', 'No retry available', 412);
        }
        source = 'paid';
        remainingRetries = paidCredits - 1;
        const consumedTotal = readStoredCoins(paid.consumedTotal, 'retry consumption total');
        transaction.set(paidRef, {
          credits: remainingRetries,
          consumedTotal: consumedTotal + 1,
          lastConsumedAt: nowDate,
          lastConsumedDate: date,
          updatedAt: nowDate,
        }, { merge: true });
      }

      const result = { success: true, source, remainingRetries, receiptId };
      transaction.set(receiptRef, {
        uid,
        date,
        requestIdHash: requestId ? sha256(requestId) : null,
        status: 'success',
        success: true,
        source,
        remainingRetries,
        receiptId,
        createdAt: nowDate,
      });
      return result;
    });
  };
}

function validateRetryAttempt(data) {
  const input = data || {};
  const score = parseStrictInteger(input.score, 'score', { min: 0, max: RETRY_ATTEMPT_RESULTS });
  const streak = parseStrictInteger(input.streak, 'streak', { min: 0, max: 1000000 });
  if (!Array.isArray(input.results) || input.results.length !== RETRY_ATTEMPT_RESULTS
      || !input.results.every((value) => typeof value === 'boolean')) {
    throw new CommerceError('invalid-argument', 'results must contain five booleans', 400);
  }
  if (!Array.isArray(input.times) || input.times.length !== RETRY_ATTEMPT_RESULTS
      || !input.times.every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 3600)) {
    throw new CommerceError('invalid-argument', 'times must contain five finite values', 400);
  }
  return { score, streak, results: [...input.results], times: [...input.times] };
}

function createSaveRetryAttemptHandler(options) {
  const { db, now = () => new Date() } = options;

  return async function saveTruthleRetryAttempt(data, context) {
    const uid = requireAuth(context);
    const attempt = validateRetryAttempt(data);
    const nowDate = now();
    const date = utcDateKey(nowDate);
    const entitlementRef = db.collection('truthle_retry_entitlements').doc(retryEntitlementId(date, uid));
    const paidRef = db.collection('truthle_paid_retries').doc(uid);
    const attemptRef = db.collection('users').doc(uid).collection('truthle_retries').doc(date);

    return db.runTransaction(async (transaction) => {
      const entitlementSnap = await transaction.get(entitlementRef);
      const paidSnap = await transaction.get(paidRef);
      const entitlement = snapshotData(entitlementSnap) || {};
      const paid = snapshotData(paidSnap) || {};
      const consumedFree = entitlement.consumed === true && entitlement.date === date;
      const consumedPaid = paid.lastConsumedDate === date;
      if (!consumedFree && !consumedPaid) {
        throw new CommerceError('failed-precondition', 'Retry has not been consumed today', 412);
      }
      transaction.set(attemptRef, {
        ...attempt,
        timestamp: nowDate,
        serverSavedAt: nowDate,
      });
      return { success: true };
    });
  };
}

module.exports = {
  retryEntitlementId,
  retryReceiptId,
  createGetRetryStatusHandler,
  createConsumeRetryHandler,
  createSaveRetryAttemptHandler,
  validateRetryAttempt,
};
