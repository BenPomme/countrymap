# Core persistence acceptance

Date: 2 November 2026

## Scope

Owned files only:

- `tests/core-persistence.test.ts`
- `docs/qa-core-persistence.md`
- `.scratch/REPORT.md`

The test imports the actual daily lifecycle, local state, attempt lifecycle,
commerce service and storage modules. Firebase config, Firestore and Functions
are replaced only at their module boundaries through `registerHooks`.

## Lifecycle repair

The copied test used a top level `await import()` for `storage`. The package is
CommonJS, so Node failed before registering assertions. The import now runs in an
async `before` hook after the Firebase module hooks and browser storage fixtures
are installed. No application module or test assertion was changed.

## Focused command

```sh
node --import tsx --test tests/core-persistence.test.ts
```

Result: 9 tests, 8 passed, 1 failed, 0 cancelled, 0 skipped.

Covered and passing:

- UTC day boundaries, missed days and rollover streak values.
- First daily completion awards coins once; a persisted replay changes no progress or coins.
- Local state sanitization preserves valid progress and integer credits.
- Storage performs one first completion and does not cloud write on replay.
- Retry request ID is reused after a lost response and service reload.
- Wallet receipts prevent duplicate application across reload and account switch.
- Storage wallet claims add one receipt once, including across an account switch.
- A failed cloud sync keeps the durable wallet request ID.

## App defect

`src/lib/truthle/storage.ts:697` catches every `syncCloudCoins` error and returns
`0`. The failing acceptance test verifies that a transient wallet claim failure
must reject instead of being reported as a successful zero balance change. At
`src/lib/truthle/storage.ts:701`, the catch logs and returns `0`, so the caller
cannot distinguish a lost response from a confirmed empty claim. The durable
request ID behavior at `src/lib/truthle/storage.ts:697` through line 704 is
otherwise working.

The implementation edit is intentionally left to the owning worker because this
task owns tests and QA documentation only.

## Boundaries

No route, saved state schema, credit, economy, backend or player-facing copy was
changed. No network, credentials, environment files, private extracts, build,
server, browser, live action, commit or deployment was used.
