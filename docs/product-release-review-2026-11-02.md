# Product release review, 2 November 2026

Status: complete source review. This is a bounded independent review at `865d53c406e71aaeddae569567482468d598656a`. It does not modify the product, establish production delivery or replace root acceptance.

## Accepted inputs

- Coordinator-reported local/mock checks: 153 frontend/data tests, 63 backend tests and 47 Python SEO tests passed; full typecheck and production build/metadata passed with 659 HTML pages and 552 indexable pages.
- Coordinator-reported browser QA: Truthle 4/5, score 567, 130 coins; TrueFalse 3/5, streak 1; both restored after reload; share focus wrap and Escape return passed.
- Prior audits accepted: 270 claim audit and primary RSF/WHR data checks.

## Pending root QA

- Advertising gating and empty-slot collapse.
- Source/vintage props passed by VisualShare callers.
- TrueFalse `0H1` during playing/done, plus jargon.

These are recorded as integration observations only, not assigned work.

## Coverage

| Surface | Status | Compact evidence |
| --- | --- | --- |
| Featured provenance | Pass | Home only uses `featuredEligible`; eligibility requires a complete RSF or WHR match and fails closed. `src/app/page.tsx:67`, `src/lib/seo/provenance.ts:184`, `:192`, `:211` |
| Question provenance | Pass | Quiz and TrueFalse paths require `quizEligible === true`. `src/lib/truthle/questionProvenance.ts:28`, `src/app/quiz/quizEligibility.ts:15`, `src/lib/truthle/generator.ts:327`, `src/lib/truthle/trueFalse.ts:102` |
| UTC streak, scoring, first result and Extra Attempt | Pass | UTC day keys, one persisted first result, replay without a new coin and deterministic base, speed and streak scoring are explicit in the helpers. `src/lib/truthle/dailyLifecycle.ts:39`, `src/lib/truthle/scoring.ts:23`, `src/lib/truthle/attemptLifecycle.ts:23`, `src/lib/truthle/storage.ts:126` |
| Two-step friend gift and cancellation | Pass | Preparation sends or copies nothing; share and copy are explicit actions; cancellation retains the prepared gift; backend enforces one use, expiry, product, issuer and quantity. `src/components/truthle/ResultSharePanel.tsx:192`, `:312`, `:420`, `functions/lib/checkout.js:90`, `:105`, `:108`, `:182` |
| Shared game, day and filter context | Pass | Canonical game/day payloads, normalized optional codes, exact UTC expiry, and serialized map/chart/discovery filters restore the intended context. `src/lib/truthle/gifts.ts:30`, `src/components/truthle/resultShare.ts:36`, `src/components/map/mapFilters.ts:119`, `src/app/charts/chartState.ts:75`, `src/app/discoveries/discoveryState.ts:122` |
| Ordinary affiliate recommendations and merchant removal | Pass | Picks are score-independent and remain visible; bounded production-source search found no removed-merchant reference, coupon, 10 percent claim or merchant teaser. `src/lib/affiliate/rewards.ts:43`, `src/components/affiliate/DailyUnlockCard.tsx:20`, `src/components/affiliate/DealQuiz.tsx:150`, `src/lib/affiliate/dailyUnlocks.ts:3` |
| Percentile, leaderboard, freshness and license claims | Pass | Bounded source search found no invented player percentile or leaderboard promise and no fake freshness or license assertion. |
| Consent, URL sanitization and analytics boundaries | Defect | Consent fails closed for unknown, GPC, preview hosts and denied choices; URLs strip query and hash; however valid telemetry is silently dropped and two Truthle events omit placement. Details below. `src/lib/analytics/consent.ts:60`, `src/lib/analytics/events.ts:13`, `:120`, `:130` |

## Defects

1. Analytics callers and schemas do not match, so intended telemetry is silently lost. `filterEventParams` intersects each payload with a per-event key allowlist and drops unsupported keys or values without surfacing the mismatch. `ResultSharePanel` sends `puzzle_day` to share and reward events that do not allow it and uses methods/statuses outside the allowed values, such as `clipboard_gift`, `native_gift`, `whatsapp_gift`, `native_image`, `handed_off`, `opened` and `blocked`. `VisualShare` sends `placement` or `status` to `share_copy`, `share_handoff` and `share_error` payloads that do not all permit them, and also uses values such as `dialog`, `url_fallback`, `image_clipboard`, `native_file`, `requested`, `capture_failed` and `handoff_failed`. Evidence: `src/lib/analytics/events.ts:13`, `:34`, `:49`, `:120`; `src/components/truthle/ResultSharePanel.tsx:127`, `:132`, `:161`, `:184`, `:207`; `src/components/share/VisualShare.tsx:187`, `:212`, `:258`, `:316`, `:385`. This is local measurement fidelity only, not an external GA4 receipt.
2. Truthle `game_start` and `game_complete` cannot distinguish primary runs from Extra Attempt runs because `TruthleGame` omits `placement`; the TrueFalse path supplies it. Evidence: `src/components/truthle/TruthleGame.tsx:389`, `:523`; `src/components/truthle/TrueFalseGame.tsx:297`, `:323`.

## Unknowns

Source review passed for the covered gates and local state behavior, with the two defects above. Browser behavior remains root-owned except for the accepted runtime checks. No conclusion is made about production release, external indexing, real payment, email delivery, GA4 receipt or revenue.
