'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { FakeFirestore } = require('./helpers/fakeFirestore');
const {
  createGetEmailPreferencesHandler,
  createQueueDailyRemindersHandler,
  createUnsubscribeRemindersHandler,
  createUnsubscribeRemindersHttpHandler,
  createUpdateEmailPreferencesHandler,
  unsubscribeTokenHash,
} = require('../lib/reminders');

const context = (uid = 'player-1', email = 'player@example.test') => ({
  auth: { uid, token: { email } },
});
const token = (letter) => letter.repeat(43);
const unsubscribeBaseUrl = 'https://europe-west1-theworldtruth.cloudfunctions.net/unsubscribeRemindersLink';

test('the reminder scheduler queues nothing while delivery is disabled', async () => {
  const db = new FakeFirestore({
    'email_subscribers/player-1': { enabled: true, email: 'player@example.test' },
  });
  const queue = createQueueDailyRemindersHandler({
    db,
    enabled: false,
    now: () => new Date('2026-11-02T09:00:00.000Z'),
  });

  assert.deepEqual(await queue(), { enabled: false, queued: 0, skipped: 0 });
  assert.deepEqual(db.paths(), ['email_subscribers/player-1']);
});

test('enabled reminders write one deterministic mail receipt per user and day', async () => {
  const db = new FakeFirestore({
    'email_subscribers/player-1': { enabled: true, email: 'player@example.test' },
  });
  let now = new Date('2026-11-02T09:00:00.000Z');
  const queue = createQueueDailyRemindersHandler({
    db,
    enabled: true,
    unsubscribeBaseUrl,
    now: () => new Date(now.getTime()),
    makeToken: () => token('A'),
  });

  assert.deepEqual(await queue(), { enabled: true, queued: 1, skipped: 0 });
  assert.equal(db.paths().filter((path) => path.startsWith('mail/')).length, 1);
  assert.equal(db.paths().filter((path) => path.startsWith('mail_delivery_receipts/')).length, 1);
  const mailPath = db.paths().find((path) => path.startsWith('mail/'));
  const mail = db.read(mailPath);
  assert.equal(mail.to, 'player@example.test');
  assert.equal(mail.template.name, 'truthle_daily_reminder');
  assert.equal(mail.template.data.unsubscribeUrl, `${unsubscribeBaseUrl}?token=${token('A')}`);

  assert.deepEqual(await queue(), { enabled: true, queued: 0, skipped: 1 });
  assert.equal(db.paths().filter((path) => path.startsWith('mail/')).length, 1);

  now = new Date('2026-11-03T09:00:00.000Z');
  assert.deepEqual(await queue(), { enabled: true, queued: 1, skipped: 0 });
  assert.equal(db.paths().filter((path) => path.startsWith('mail/')).length, 2);
  assert.equal(db.paths().filter((path) => path.startsWith('mail_delivery_receipts/')).length, 2);
});

test('concurrent scheduler runs still enqueue only one mail for the day', async () => {
  const db = new FakeFirestore({
    'email_subscribers/player-1': { enabled: true, email: 'player@example.test' },
  });
  const queue = createQueueDailyRemindersHandler({
    db,
    enabled: true,
    unsubscribeBaseUrl,
    now: () => new Date('2026-11-02T09:00:00.000Z'),
    makeToken: () => token('C'),
  });

  const results = await Promise.all([queue(), queue()]);
  assert.equal(results.reduce((sum, result) => sum + result.queued, 0), 1);
  assert.equal(db.paths().filter((path) => path.startsWith('mail/')).length, 1);
  assert.equal(db.paths().filter((path) => path.startsWith('mail_delivery_receipts/')).length, 1);
});

test('played, disabled and malformed subscribers receive no reminder', async () => {
  const db = new FakeFirestore({
    'email_subscribers/player-1': { enabled: true, email: 'played@example.test' },
    'email_subscribers/player-2': { enabled: true, email: 'active@example.test' },
    'email_subscribers/player-3': { enabled: true, email: '' },
    'email_subscribers/player-4': { enabled: false, email: 'disabled@example.test' },
    'truthle/daily/2026-11-02/player-1': { score: 5 },
  });
  const queue = createQueueDailyRemindersHandler({
    db,
    enabled: true,
    unsubscribeBaseUrl,
    now: () => new Date('2026-11-02T09:00:00.000Z'),
    makeToken: () => token('D'),
  });

  assert.deepEqual(await queue(), { enabled: true, queued: 1, skipped: 2 });
  const mails = db.paths().filter((path) => path.startsWith('mail/')).map((path) => db.read(path));
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, 'active@example.test');
  assert.equal(db.paths().some((path) => path.includes('player-1') && path.startsWith('mail')), false);
});

test('opting in creates an opaque token while keeping token state server-only', async () => {
  const db = new FakeFirestore();
  const update = createUpdateEmailPreferencesHandler({
    db,
    now: () => new Date('2026-11-02T09:00:00.000Z'),
    makeToken: () => token('E'),
  });
  const get = createGetEmailPreferencesHandler({ db });

  const result = await update({ enabled: true }, context());
  assert.deepEqual(result, { success: true, enabled: true, unsubscribeToken: token('E') });
  const subscriber = db.read('email_subscribers/player-1');
  assert.equal(subscriber.email, 'player@example.test');
  assert.equal(subscriber.enabled, true);
  assert.equal(subscriber.unsubscribeTokenHash, unsubscribeTokenHash(token('E')));
  assert.equal(subscriber.unsubscribeToken, undefined);
  assert.deepEqual(await get({}, context()), { enabled: true, email: 'player@example.test' });

  const optOut = await update({ enabled: false }, context());
  assert.deepEqual(optOut, { success: true, enabled: false, unsubscribeToken: null });
  assert.equal(db.read('email_subscribers/player-1').enabled, false);
  assert.ok(db.read('email_subscribers/player-1').unsubscribedAt instanceof Date);
});

test('email preference updates require authentication and a verified email for opt-in', async () => {
  const db = new FakeFirestore();
  const update = createUpdateEmailPreferencesHandler({ db, makeToken: () => token('F') });

  await assert.rejects(update({ enabled: true }, {}), (error) => error.code === 'unauthenticated');
  await assert.rejects(
    update({ enabled: true }, { auth: { uid: 'player-1', token: {} } }),
    (error) => error.code === 'failed-precondition',
  );
  await assert.rejects(update({ enabled: 'yes' }, context()), (error) => error.code === 'invalid-argument');
  assert.equal(db.paths().length, 0);
});

test('queued unsubscribe URL round-trips through the real HTTP adapter and replays safely', async () => {
  const db = new FakeFirestore({
    'email_subscribers/player-1': { enabled: true, email: 'player@example.test' },
  });
  const queue = createQueueDailyRemindersHandler({
    db,
    enabled: true,
    unsubscribeBaseUrl,
    now: () => new Date('2026-11-02T09:00:00.000Z'),
    makeToken: () => token('G'),
  });
  const unsubscribe = createUnsubscribeRemindersHandler({
    db,
    now: () => new Date('2026-11-02T10:00:00.000Z'),
  });
  await queue();

  const mailPath = db.paths().find((path) => path.startsWith('mail/'));
  const unsubscribeUrl = new URL(db.read(mailPath).template.data.unsubscribeUrl);
  assert.equal(`${unsubscribeUrl.origin}${unsubscribeUrl.pathname}`, unsubscribeBaseUrl);
  assert.equal(unsubscribeUrl.searchParams.get('token'), token('G'));
  assert.equal(unsubscribeUrl.searchParams.has('unsubscribe'), false);
  assert.equal(unsubscribeUrl.toString().includes('player-1'), false);
  assert.equal(unsubscribeUrl.toString().includes('player@example.test'), false);

  const route = createUnsubscribeRemindersHttpHandler({ unsubscribe });
  const browserQuery = Object.fromEntries(unsubscribeUrl.searchParams.entries());
  assert.deepEqual(
    await route({ method: 'GET', query: browserQuery }),
    { status: 200, body: 'Reminder preferences updated.' },
  );
  assert.equal(db.read('email_subscribers/player-1').enabled, false);
  const tokenPath = db.paths().find((path) => path.startsWith('email_unsubscribe_tokens/'));
  assert.equal(db.read(tokenPath).status, 'used');

  assert.deepEqual(
    await route({ method: 'GET', query: browserQuery }),
    { status: 200, body: 'Reminder preferences updated.' },
  );
  assert.deepEqual(await queue(), { enabled: true, queued: 0, skipped: 0 });
});

test('enabled reminders fail closed before queueing when the trusted unsubscribe URL is invalid', async () => {
  const invalidBaseUrls = [
    undefined,
    '',
    'not a url',
    'http://europe-west1-theworldtruth.cloudfunctions.net/unsubscribeRemindersLink',
    'https://user:secret@europe-west1-theworldtruth.cloudfunctions.net/unsubscribeRemindersLink',
    `${unsubscribeBaseUrl}?region=eu`,
    `${unsubscribeBaseUrl}#fragment`,
  ];

  for (const invalidBaseUrl of invalidBaseUrls) {
    const db = new FakeFirestore({
      'email_subscribers/player-1': { enabled: true, email: 'player@example.test' },
    });
    let tokenFactoryCalls = 0;
    const queue = createQueueDailyRemindersHandler({
      db,
      enabled: true,
      unsubscribeBaseUrl: invalidBaseUrl,
      now: () => new Date('2026-11-02T09:00:00.000Z'),
      makeToken: () => {
        tokenFactoryCalls += 1;
        return token('B');
      },
    });

    await assert.rejects(
      queue(),
      (error) => error.code === 'failed-precondition' && error.httpStatus === 503,
    );
    assert.equal(tokenFactoryCalls, 0);
    assert.deepEqual(db.paths(), ['email_subscribers/player-1']);
  }
});

test('HTTP unsubscribe rejects wrong, malformed and non-GET requests without changing state', async () => {
  const db = new FakeFirestore({
    'email_subscribers/player-1': { enabled: true, email: 'player@example.test' },
  });
  const queue = createQueueDailyRemindersHandler({
    db,
    enabled: true,
    unsubscribeBaseUrl,
    now: () => new Date('2026-11-02T09:00:00.000Z'),
    makeToken: () => token('H'),
  });
  const unsubscribe = createUnsubscribeRemindersHandler({ db });
  const route = createUnsubscribeRemindersHttpHandler({ unsubscribe });
  await queue();

  const tokenPath = db.paths().find((path) => path.startsWith('email_unsubscribe_tokens/'));
  const beforePaths = db.paths();
  const beforeSubscriber = db.read('email_subscribers/player-1');
  const beforeToken = db.read(tokenPath);
  const invalidCases = [
    [{ method: 'GET', query: { unsubscribe: token('H') } }, 400],
    [{ method: 'GET', query: {} }, 400],
    [{ method: 'GET', query: { token: 'short' } }, 400],
    [{ method: 'GET', query: { token: [token('H')] } }, 400],
    [{ method: 'POST', query: { token: token('H') } }, 405],
  ];

  for (const [request, status] of invalidCases) {
    const result = await route(request);
    assert.equal(result.status, status);
    assert.equal(result.body, status === 405 ? 'Method not allowed' : 'Unsubscribe link is invalid.');
  }

  assert.deepEqual(db.paths(), beforePaths);
  assert.deepEqual(db.read('email_subscribers/player-1'), beforeSubscriber);
  assert.deepEqual(db.read(tokenPath), beforeToken);
});

test('invalid and malformed unsubscribe links fail closed', async () => {
  const db = new FakeFirestore();
  const unsubscribe = createUnsubscribeRemindersHandler({ db });

  await assert.rejects(unsubscribe({ token: 'short' }), (error) => error.code === 'invalid-argument');
  await assert.rejects(unsubscribe({ token: token('H') }), (error) => error.code === 'not-found');
  await assert.rejects(unsubscribe({}), (error) => error.code === 'invalid-argument');
  assert.equal(db.paths().length, 0);
});
