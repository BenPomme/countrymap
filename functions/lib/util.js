'use strict';

const crypto = require('crypto');

class CommerceError extends Error {
  constructor(code, message, httpStatus = 400, details = undefined) {
    super(message);
    this.name = 'CommerceError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }
}

function fail(code, message, httpStatus, details) {
  throw new CommerceError(code, message, httpStatus, details);
}

function requireAuth(context) {
  const uid = context && context.auth && context.auth.uid;
  if (typeof uid !== 'string' || uid.length < 1 || uid.length > 256) {
    throw new CommerceError('unauthenticated', 'User must be authenticated', 401);
  }
  return uid;
}

function requireString(value, name, options = {}) {
  const { min = 1, max = 256, pattern = null, patternMessage = null } = options;
  if (typeof value !== 'string') {
    throw new CommerceError('invalid-argument', `${name} must be a string`, 400);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new CommerceError('invalid-argument', `${name} has an invalid length`, 400);
  }
  if (pattern && !pattern.test(trimmed)) {
    throw new CommerceError('invalid-argument', patternMessage || `${name} has an invalid format`, 400);
  }
  return trimmed;
}

function requireRequestId(value) {
  return requireString(value, 'requestId', {
    min: 8,
    max: 200,
    pattern: /^[A-Za-z0-9._:-]+$/,
    patternMessage: 'requestId must use letters, digits, dot, colon, underscore or hyphen',
  });
}

function normalizeShareCode(value) {
  if (typeof value !== 'string') {
    throw new CommerceError('invalid-argument', 'shareCode must be a string', 400);
  }
  const code = value.trim();
  if (code.length < 4 || code.length > 64 || !/^[A-Za-z0-9_-]+$/.test(code)) {
    throw new CommerceError('invalid-argument', 'shareCode has an invalid format', 400);
  }
  return code;
}

function parseStrictInteger(value, name, options = {}) {
  const { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, defaultValue = undefined } = options;
  if ((value === undefined || value === null || value === '') && defaultValue !== undefined) return defaultValue;
  let parsed = value;
  if (typeof value === 'string' && /^-?\d+$/.test(value.trim())) parsed = Number(value.trim());
  if (typeof parsed !== 'number' || !Number.isSafeInteger(parsed)) {
    throw new CommerceError('invalid-argument', `${name} must be a finite integer`, 400);
  }
  if (parsed < min || parsed > max) {
    throw new CommerceError('invalid-argument', `${name} is out of range`, 400);
  }
  return parsed;
}

function readStoredCoins(value, name = 'wallet coins') {
  if (value === undefined || value === null) return 0;
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new CommerceError('failed-precondition', `${name} are corrupt`, 409);
  }
  return value;
}

function parseAmountCents(value) {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new CommerceError('invalid-argument', 'amount must be a number', 400);
  }
  const raw = String(value).trim();
  if (!/^\d+(?:\.\d{1,4})?$/.test(raw)) {
    throw new CommerceError('invalid-argument', 'amount must be a positive finite number', 400);
  }
  const cents = Number(raw);
  if (!Number.isFinite(cents) || cents <= 0 || cents > 100000000) {
    throw new CommerceError('invalid-argument', 'amount is out of range', 400);
  }
  return cents;
}

function parseRewardAmount(value) {
  if (value === undefined || value === null || value === '') return 1;
  const parsed = parseStrictInteger(value, 'reward_amount', { min: 1, max: 1000 });
  return parsed;
}

function sha256(value) {
  return crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');
}

function md5(value) {
  return crypto.createHash('md5').update(String(value), 'utf8').digest('hex');
}

function safeEqualHex(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  if (left.length !== right.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
  } catch (error) {
    return false;
  }
}

function safeEqualText(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function utcDateKey(date = new Date()) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function endOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0, 0));
}

function readString(value) {
  return typeof value === 'string' ? value : null;
}

function snapshotData(snapshot) {
  return snapshot && snapshot.exists ? snapshot.data() : null;
}

function toSafeError(error) {
  if (error instanceof CommerceError) return error;
  return new CommerceError('internal', 'Internal error', 500);
}

module.exports = {
  CommerceError,
  fail,
  requireAuth,
  requireString,
  requireRequestId,
  normalizeShareCode,
  parseStrictInteger,
  readStoredCoins,
  parseAmountCents,
  parseRewardAmount,
  sha256,
  md5,
  safeEqualHex,
  safeEqualText,
  utcDateKey,
  endOfUtcDay,
  readString,
  snapshotData,
  toSafeError,
};
