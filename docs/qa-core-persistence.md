# Core persistence acceptance

Date: 2 November 2026

## Scope

Owned files:

- `tests/core-persistence.test.ts`
- `docs/qa-core-persistence.md`
- `CLAUDE.md`
- `.scratch/REPORT.md`

The test imports the actual daily lifecycle, local state, attempt lifecycle,
commerce service and storage modules. Firebase config, Firestore and Functions
are replaced only at their module boundaries through Node's
`module.registerHooks` API.

## Test harness compatibility

The installed Node type declarations are `@types/node` 20.19.43 while the test
runtime is Node 22.23.4. Node 22 exposes `module.registerHooks`, but the Node 20
declarations do not. A direct named import therefore failed root `tsc` with
TS2305 and implicit-any hook parameters.

The test now dynamically imports `node:module` as `unknown` inside the async
`before` hook, validates the runtime with a local type guard and a narrow
`NodeModuleApi` interface, and throws a descriptive error when `registerHooks`
is unavailable. Hooks are registered before the deferred `storage` import.

This keeps Node 20 typechecking and Node 22 runtime execution without
application code changes, package upgrades, `any`, `@ts-ignore`, skipped checks
or global harness changes. Executing this test requires Node 22.15 or newer;
the focused run below used Node 22.23.4. CI on Node 20 typechecks but does not
execute Node tests.

## Wallet behavior

The integrated wallet repair makes `syncCloudCoins` await the wallet claim and
propagate a transient `CommerceRequestError` instead of returning zero. The
first lost-sync case now asserts that rejection and then verifies that the
durable request ID remains stored. The second case independently protects the
same rejection behavior against a zero fallback.

The first case previously awaited success, which contradicted both the second
case and the integrated implementation. Only that stale expectation changed;
the request ID persistence assertions remain.

## Focused result

```sh
node --import tsx --test tests/core-persistence.test.ts
```

Result: 9 tests, 9 passed, 0 failed, 0 cancelled, 0 skipped.

Passing coverage:

- UTC day boundaries, missed days and rollover streak values.
- First daily completion awards coins once; a persisted replay changes no progress or coins.
- Local state sanitization preserves valid progress and integer credits.
- Storage performs one first completion and performs no cloud write on replay.
- Retry request ID is reused after a lost response and service reload.
- Wallet receipts prevent duplicate application across reload and account switch.
- Storage wallet claims add one receipt once, including across an account switch.
- Failed cloud sync rejects and preserves the durable wallet request ID.
- Cloud sync surfaces a transient claim failure instead of reporting zero.

Root TypeScript check:

```sh
./node_modules/.bin/tsc --noEmit --pretty false
```

Result: exit 0, no diagnostics.

## Catalogue count correction

`CLAUDE.md` no longer hard codes variable, numeric/categorical, coverage or
correlation snapshot counts. It now directs maintainers to count the initialized
app catalogue after `src/lib/constants/extraVariables.ts` extends `VARIABLES`,
to current country data, and to generated correlation output. Other
documentation was preserved.

An isolated count from that initialized catalogue returned 106 topics, with 105
numeric and 1 categorical. This count is evidence for this run and is not copied
into `CLAUDE.md`.

## Boundaries

No application source, route, saved state schema, credit, economy, backend or
player-facing copy was changed. No network, credentials, environment files,
private extracts, build, server, browser, live action, commit or deployment was
used.
