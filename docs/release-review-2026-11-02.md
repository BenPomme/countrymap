# Release review, 2 November 2026

Status: local review package ready, release not approved and not deployed. This record is based on root source checkpoint `b19b5f9`, coordinator-supplied local evidence and public repository inspection. It does not establish production delivery or replace root acceptance.

## Decision summary

- Ready for user first review: desktop and mobile home, statistic, game result, rewards and the remaining route families listed below. Local P8 is accepted with state-by-state limitations recorded in the checklist.
- Not ready to call complete: user visual review, separate frontend and backend rollout approval, real ad fill, live Stripe, real email delivery, GA4 production verification and post-launch measurement.
- No release action is authorized by this document. Frontend and backend rollout require separate user approval. Root creates the draft PR and final delivery record. No merge, main push or deploy occurs here.

## Evidence basis

- The root `production-export-release.txt` check passed at `b19b5f9`: 659 audited HTML pages, including 552 indexable pages and 106 noindex embeds. All 552 sitemap URLs returned 200. Invalid map, country, embed and claim slugs returned 404. All 109 expected Open Graph paths exist, and the 106 map plus 2 game cards produced 108 PNGs at 1200x630.
- Full integrated frontend and data tests passed 174 of 174 with zero skips and failures, including map and share colocated tests plus primary-source fixtures. Backend passed 66 of 66 with zero skips and failures, and Python SEO passed 47 of 47. TypeScript passed. Lint retained one existing image warning. Clean locked `npm ci` installed 541 packages.
- Final browser evidence includes desktop and mobile screenshots for the four main review surfaces, native cancel, clipboard denial, a quiz with 4 distinct sourced questions at 25 points and no percentage claim, and the actual 1200x630 map and 1080x1080 game cards. The map card was inspected through a 900 pixel preview. The root shell report at `coordination/reports/final-shell-browser.json` also passed the embed, claim, comparison and privacy shell checks.
- Earlier product and commerce reviews were bounded at old checkpoints. Later repairs addressed analytics payloads, share provenance, game headings, ad collapse, unsubscribe routes, verified opt-in and footer order. Those old findings remain historical evidence, not current defect claims.
- No private analytics totals, credentials, environment files, raw gift codes, account IDs or email addresses are included. No live payment, email, gift mint, provider callback or analytics event was invoked during accepted QA.

## Route family coverage

The full state-by-state matrix is in `docs/acceptance-checklist.md`. This release summary covers every route family:

| Family | Routes | Release-relevant states |
| --- | --- | --- |
| Public discovery | `/`, `/map/[slug]/`, `/embed/[slug]/`, `/country/[slug]/` | Loading, featured and fallback, filters, no match, invalid slug, source and vintage, map, ranking, share, mobile dialog, noindex embed |
| Daily games | `/truthle/`, `/true-false/` | Loading, intro, playing, answered or done, result, unavailable, error, saved progress, UTC rollover, missed day, retry and checkout return |
| Result and sharing | Result state within each game | Spoiler-free card, gift preparation and cancellation, focus wrap, Escape return, clipboard success or denial, manual fallback, native cancel or failure and downloads |
| Economy | `/truthle/shop/` | Loading, load error, wallet sync failure and retry, owned items, insufficient coins, purchase error and empty category |
| Offers and gifts | `/rewards/`, `/challenge/` | Ordinary offers at all scores, merchant removal, gift terms, current day, past, future, invalid link and code entry without open-time consumption |
| Explorers and quiz | `/charts/`, `/discoveries/`, `/quiz/` | Loading, populated, no match or no values, URL filter restore, pair dialog restore, quiz intro, playing, answered and finished |
| Editorial and trust | `/true-false/claims/`, `/true-false/claims/[slug]/`, `/truthle-vs-worldle/`, `/privacy/` | Catalogue, valid and missing detail, source limitations, editorial-review warning, static comparison and consent choices |
| System outputs | Missing route, sitemap, canonical paths, Open Graph and cards | 200 for sitemap URLs, 404 for missing route, noindex embeds, metadata presence and expected image dimensions |

## What is locally accepted

### Product behavior

- At 390x844 and 1440x1000, home, statistic, result and rewards had no overflow. Statistic source is WHR 2026 with 140 of 164 country values. There are 177 world paths. Source, share and map sit near the first screen. France had one H1 and no overflow.
- Charts restored axes and filters from the URL. Discoveries covered empty and recovery-filtered pair states and restored the pair dialog. The final quiz showed 4 distinct sourced questions at 25 points, a 1 of 4 state, no percentage claim and visible source panels. Semantic deduplication has 4 tests.
- Truthle state after reload: 4 of 5, score 567, streak 1 and 130 coins. True or False state after reload: 3 of 5 and streak 1. The next-puzzle countdown uses 00:00 UTC and no extra coin appeared after reload.
- Challenge current, past, future and invalid states were correct. Opening a challenge caused no mint, redemption or network action. A failed coin-shop sync preserved 130 coins and showed an error plus retry.
- The footer opens the actual privacy dialog. Unknown and denied consent load no optional analytics or ads. Local preview and denied states show no ad and no fake placeholder. The mobile WhatsApp share action remained above the fold after the empty ad placement collapsed. The final shell report confirms corrected header, main and footer order, with no overflow on the checked claim, comparison, privacy and embed pages.

### Sharing and economy

- Share focus wraps, Escape closes and focus returns. Actual source and vintage appear. Clipboard denial exposes the exact game/day challenge URL, and the manual fallback contains no spoilers. Native cancel and failure states are truthful.
- Actual downloads were confirmed: map card 1200x630 and game card 1080x1080. The map card preview showed the world map filling the right slot, no tooltip, legend or controls, readable source and vintage, and the honest scoped Finland 7.76 fact. Its Europe-filtered URL was exact. A real OS clipboard read is not proven.
- The friend gift is one shared Extra Attempt across both games, not a game-specific product. Preparation sends or copies nothing. Cancellation retains the prepared code.
- Mocked transaction coverage includes missed day UTC, duplicate concurrent requests, lost response, checkout owner spoofing, delayed and unpaid duplicate webhooks, expired or self-redeemed gift, wrong product, provider atomicity, wallet price claims and replay.
- Reminder UI and delivery default off. Opt-in requires a verified email; opt-out permits an unverified address. Generated unsubscribe links, route parameters and replay now have focused backend evidence. Mocked mail is not delivery.

### Measurement and research

- Consent unknown, denial and GPC produce zero optional tags. Page locations and external referrers are reduced before analytics. Unit tests prove local payload construction only.
- DataForSEO pilot: 248 distinct queries, 496 US and UK rows, 203 nonnull volume rows, 293 unknown, 20 SERPs with 173 organic items, 22 settled requests and USD 0.22 actual within the USD 5 cap using existing credits. Frozen cache hash `6a3a1c7569ea2888`. The collection date was 2026-11-02 for US and UK English.
- Ten existing URL priorities were semantically reviewed. Root verified the values and top five URLs. Weekly checks are scheduled for 9, 16, 23 and 30 November at 09:00 Madrid with no top-up or volume requery.
- All 164 bundled RSF values and all 140 available WHR happiness values match downloaded primary data. Only those two metrics are approved for featured and daily-question promotion.
- All 270 claim pages were reviewed. Three stale sitemap URLs were already 404 before this work. No mass deletion or noindex action was made. 158 pages still need editorial source review before promotion.

## Real gaps and unknowns

| Gap | Current truth | Required closure |
| --- | --- | --- |
| Ads | Local preview and denied states correctly show nothing. No network-filled ad was accepted. | Verify a real filled ad in an approved environment. |
| Clipboard | Manual fallback and helper states pass. | Real OS clipboard read remains unproven and should stay documented as such. |
| GA4 | Local consent and payload tests pass. Prior All users data mixes property streams. | Verify the World Truth stream, consent, realtime receipt, cross-domain referral and enhanced-measurement automatic-event privacy and settings. A World Truth-only baseline is required. |
| GSC and external results | A private actual baseline exists outside Git. No external result is implied. | After indexing, measure real indexing and clicks separately from GA4. Do not publish private raw totals. |
| Live commerce | Mock and transaction tests pass. | Run controlled Stripe checkout and webhook verification before enabling live payment. Verify real retry, gift, wallet and provider reconciliation. |
| Reminder delivery | Code and mocked tests pass. Delivery and UI are off. | Configure a trusted HTTPS unsubscribe destination, then verify real opt-in delivery and unsubscribe before enabling UI or delivery. |
| Conditional state coverage | Local P8 is accepted. Runtime checks cover the named first-review states, but not every conditional state was manually browser-tested. | Keep the checklist distinction between observed browser states and unit, mock, source or integration coverage. Add browser checks when a release decision depends on an unobserved state. |
| Post-launch outcomes | Nothing has been observed yet. | Measure seven-day further-game completion, confirmed transactions and four-week commission after launch. |

## Rollout sequence

1. Local evidence is complete: 174 of 174 frontend and data tests, 66 of 66 backend tests and 47 of 47 Python SEO tests passed with zero skips and failures. The final export, invalid-route checks, cards and changed browser states are recorded.
2. Assemble the user first-review package described below. Root independently accepts the evidence and final records.
3. Obtain separate user decisions for frontend and backend rollout. Approval of one track must not imply approval of the other.
4. Root creates the draft PR and records the exact URL and final delivery evidence. Do not guess a PR URL. Do not merge, push main or deploy as part of a worker task.
5. For an approved backend track, record the deployment receipt and controlled smoke evidence. Confirm function compatibility before enabling checkout, gifts, wallet transfers, provider callbacks or reminders.
6. For an approved frontend track, record the static export deployment receipt and run route, canonical, 404, sitemap and Open Graph smoke checks.
7. Before mail is enabled, configure a trusted HTTPS unsubscribe destination. Verify real opt-in delivery and unsubscribe end to end. Keep reminder UI and delivery off until both pass.
8. Before payment is enabled, run controlled Stripe checkout and webhook verification. Confirm delayed, duplicate and unpaid cases grant no extra credit. Verify retry, gift and wallet behavior with approved accounts.
9. Before measurement is treated as live, verify the World Truth GA4 stream, consent, realtime receipt, cross-domain referral and enhanced-measurement automatic-event privacy and settings. No account setting change is authorized by this document or the worker.
10. After public launch, inspect GSC indexing and clicks. Measure seven-day further-game completion, confirmed transactions and traffic and commission separately for four weeks. Keep consent limits, attribution gaps and reporting delay explicit.

## User first-review package

Review in this order:

1. Desktop and mobile home at 1440x1000 and 390x844. Check the featured source, fallback, map, selected metric, filters, data sources and share.
2. Desktop and mobile statistic at both viewports. Check fact, source, vintage, coverage, limitations, ranking, map, filters, share and the accepted map card preview.
3. Desktop and mobile game result after one Truthle and one True or False run. Check score, streak, saved progress, no repeat coin, spoiler-free share, clipboard denial fallback, native cancel, gift preparation and download.
4. Desktop and mobile rewards. Check ordinary offers at any score, non-verified deal wording, merchant removal, friend gift terms, challenge links and no overflow.
5. Remaining route families: country, embed, shop, challenge, charts, discoveries, quiz, claims catalogue and detail, comparison, privacy and missing route. Use the state matrix in `docs/acceptance-checklist.md`.
6. Review the evidence records: `docs/acceptance-checklist.md`, `docs/product-release-review-2026-11-02.md`, `docs/commerce-release-review-2026-11-02.md` and `docs/measurement-acceptance.md`. Treat the older product and commerce reviews as bounded historical reviews, with later repairs noted above.

The package includes four desktop and mobile first-review screenshots for root assembly. Root owns exact screenshot paths, preview URLs and the eventual PR URL. This worker does not invent those locations.

## Source and research limitations

- RSF and WHR are the only matched, promotion-eligible sources. All 164 bundled RSF values and all 140 available WHR values matched. Other metrics may remain browseable but unknown and must not be called verified or used for generated questions.
- WHR coverage is 140 of 164 country records. Missing countries remain unknown rather than zero or invented.
- The claim catalogue has 270 reviewed pages, but 158 need editorial source checks before promotion. Existing uncertain claims stay browseable unless a separate safety decision is made. No mass deletion was performed.
- The DataForSEO pilot is limited to US and UK English on 2026-11-02 and 20 selected SERPs. Volumes are unknown for 293 rows. Pricing and rankings are point-in-time evidence, not guaranteed rankings or traffic.
- Search Console and GA4 are different systems with different scopes and delays. The prior GA4 All users view mixes property streams and cannot attribute all site traffic. Private raw totals must not be published.
- Unit tests with stubbed analytics prove payload construction only. Mocked commerce tests prove code paths, not real payment or provider delivery. Browser QA proves observed states, not production availability.
- No generated claim, score percentile, deal validity, merchant verification, fresh-data claim or live result is inferred from this package.

## Exit criteria for root

- Final integrated test, export, route and browser results are recorded without inventing counts.
- Observed browser states are distinguished from unit, mock, source and integration coverage.
- The draft PR is created by root with its exact URL.
- User review is complete and frontend and backend decisions are recorded separately.
- Every live gate in `docs/acceptance-checklist.md` remains visible until its real environment check passes.
