# DataForSEO evidence pilot

Date: 2026-11-02

Status: implementation complete in this worker checkout. Parent integration, live execution and acceptance remain pending.

## Purpose

This CLI collects a small, auditable SEO evidence pilot for existing URLs. It does not create pages, change saved progress or credits, or assign SEO difficulty. It uses only two reviewed DataForSEO Live endpoints:

- Google Ads search volume at `/v3/keywords_data/google_ads/search_volume/live`.
- Google organic SERP advanced at `/v3/serp/google/organic/live/advanced`.

Every mode is local and dry by default. Paid collection requires both `--execute` and one persistent `--state-dir`. The default transport reads DataForSEO credentials only when a parent executes an approved request. Credentials are never written to artifacts or logs.

## Commands

```sh
python3 scripts/seo/pilot.py inventory --repo-root .
python3 scripts/seo/pilot.py quote
python3 scripts/seo/pilot.py collect-volumes --state-dir .scratch/seo-pilot-state
python3 scripts/seo/pilot.py plan-serps --state-dir .scratch/seo-pilot-state --repo-root .
python3 scripts/seo/pilot.py collect-serps --state-dir .scratch/seo-pilot-state
python3 scripts/seo/pilot.py weekly --state-dir .scratch/seo-pilot-state --date 2026-11-09
python3 scripts/seo/pilot.py report --state-dir .scratch/seo-pilot-state --repo-root .
```

Add `--execute` to a collection command only after parent review. The examples above describe the available modes and do not authorize a paid run.

## State layout

- `ledger.json`: one USD5 ledger for initial and weekly requests.
- `cache/`: idempotency cache keyed by endpoint and deterministic cache key.
- `ads_volumes.json`: initial US and UK monthly volume collection.
- `selected_serps.json`: immutable initial selection with an integrity digest.
- `initial_serps.json`: initial depth 10 organic results.
- `weekly/YYYY-MM-DD.json`: one artifact per allowed weekly date.
- `evidence_report.json` and `evidence_report.md`: final evidence outputs.

There is no reset, alternate ledger, top-up or retry flag. Pending or unknown reservations remain in the ledger and count against the fixed budget. A cache hit costs zero but remains tied to its original ledger entry.

## Limits and quote

- Markets: United States `2840` and United Kingdom `2826`.
- Language: `en`.
- Inventory limit: at most 500 query and market combinations.
- Initial SERP selection: 1 to 20 keyword and market pairs, depth 10, desktop Windows.
- Weekly requests: the same frozen selection, up to 20 pairs per allowed date.
- Initial estimate: 2 volume requests at USD0.09 plus 20 SERPs at USD0.002, total USD0.22.
- Four weekly SERP runs: 80 requests at USD0.002, total USD0.16.
- Whole pilot estimate: USD0.38, leaving USD4.62 of the USD5 ledger as planning headroom.

These estimates are not price guarantees. A parent or weekly supervisor must reverify the fixed price manifest before its review date expires. This CLI never renews a stale manifest, changes a price or performs an automatic retry.

## Weekly schedule

Paid weekly work is limited to 2026-11-09, 2026-11-16, 2026-11-23 and 2026-11-30. Other dates, future runs and paid work after 2026-11-30 are rejected before transport. Weekly mode reuses the frozen selection and does not repeat monthly volume collection.

## Cache keys

- Initial volume: collection date, market and language.
- Initial SERP: frozen selection digest, keyword, market and language.
- Weekly SERP: weekly date, frozen selection digest, keyword, market and language.

Repeating the same command reuses its artifact or cache entry without a new charge. The frozen selection fails its digest check if edited.

## Request envelope

Both allowlisted endpoints receive one top-level JSON array containing one task, in the official DataForSEO request shape:

```json
[{"keywords":["daily geography quiz"],"location_code":2840,"language_code":"en"}]
```

The injected transport has the same contract: `transport(url, tasks)` where `tasks` is that one-element array. The response must report one task with an echoed task payload.

## Failure and reporting semantics

- A known provider failure is settled at its actual reported cost and recorded as an error.
- A timeout, missing cost or ambiguous response remains an unresolved reservation and is not replayed automatically.
- Missing volumes remain `null`, not zero. Positions beyond depth 10 are unknown and censored, not position zero.
- Difficulty remains `unknown`. Advertiser competition is not treated as SEO difficulty.
- Artifact status is `complete`, `partial`, `unavailable` or `no_results`; errors and unavailable endpoints are retained in the evidence report.
- Collection artifacts stamp collection date, market, language, depth, actual provider cost and the ledger summary.

## Verification

Offline tests cover the official array envelope, fixed budget admission, unknown outcomes, request limits, cache reuse, frozen selection integrity, weekly date guards, dry mode and the shared ledger across the complete pilot. The focused suites are:

```sh
python3 -m unittest tests/seo_client_test.py tests/seo_pilot_test.py -v
```

No live API request, credential read, commit, build, server, browser or deployment was performed by this worker.
