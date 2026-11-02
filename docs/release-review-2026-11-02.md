# Release review, 2 November 2026

Status: local review package ready, release not approved and not deployed. This record is based on source checkpoint `61e91c2613663ce65e4bd9c187b2c6d0e178200c`, coordinator-supplied local evidence and public repository inspection. It does not establish production delivery or replace root acceptance.

## Decision summary

- Ready for user first review: desktop and mobile home, statistic, game result, rewards and the remaining route families listed below.
- Not ready to call complete: final integrated frontend rerun, two final leaf workstreams, final browser rerun for their three visible issues, real ad fill, live Stripe, real email delivery, GA4 production verification and post-launch measurement.
- No release action is authorized by this document. Frontend and backend rollout require separate user approval. Root creates the draft PR and final delivery record. No merge, main push or deploy occurs here.

## Evidence basis

- Production build passed at `865d53c`. The later Next build plus metadata run at `8608066` produced 659 HTML files, 552 indexable pages and 106 noindex embeds.
- Root HTTP checks returned 200 for all 552 sitemap URLs, 404 for a missing route and presence for all 109 expected Open Graph paths. The 106 map cards and 2 game cards produced 108 PNGs at 1200x630.
- Original full frontend run: 153 passes. Ads and analytics each added 4 focused tests. Later integrated changes require a final rerun, so this document does not assert a final total.
- Latest isolated worker run: 140 passes and 2 source-data skips. Root has the actual fixtures and will rerun the skipped cases. Backend latest leaf: 66 of 66. Python: 47 of 47 root. Full typecheck passed. Lint has one unchanged preview-image warning. Clean locked `npm ci` installed 541 packages.
- The earlier product and commerce reviews were bounded at `865d53c`. Later commits `d990e75` and `e1980b9` addressed the identified analytics payload, share provenance, game heading, ad collapse, unsubscribe route and verified opt-in gaps with focused tests. Those old findings remain historical evidence, not current defect claims. A final rerun is still required.
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
- Charts restored axes and filters from the URL. Discoveries covered empty and recovery-filtered pair states and restored the pair dialog. The quiz had earlier browser evidence for intro, playing, answered and finished.
- Truthle state after reload: 4 of 5, score 567, streak 1 and 130 coins. True or False state after reload: 3 of 5 and streak 1. The next-puzzle countdown uses 00:00 UTC and no extra coin appeared after reload.
- Challenge current, past, future and invalid states were correct. Opening a challenge caused no mint, redemption or network action. A failed coin-shop sync preserved 130 coins and showed an error plus retry.
- The footer opens the actual privacy dialog. Unknown and denied consent load no optional analytics or ads. Local preview and denied states show no ad and no fake placeholder. The mobile WhatsApp share action remained visible after the ad placement collapsed.

### Sharing and economy

- Share focus wraps, Escape closes and focus returns. Actual source and vintage appear. Clipboard denial exposes the exact game/day challenge URL, and the manual fallback contains no spoilers. Native cancel and failure states are truthful.
- Actual downloads were confirmed: map card 1200x630 and game card 1080x1080. A real OS clipboard read is not proven.
- The friend gift is one shared Extra Attempt across both games, not a game-specific product. Preparation sends or copies nothing. Cancellation retains the prepared code.
- Mocked transaction coverage includes missed day UTC, duplicate concurrent requests, lost response, checkout owner spoofing, delayed and unpaid duplicate webhooks, expired or self-redeemed gift, wrong product, provider atomicity, wallet price claims and replay.
- Reminder UI and delivery default off. Opt-in requires a verified email; opt-out permits an unverified address. Generated unsubscribe links, route parameters and replay now have focused backend evidence. Mocked mail is not delivery.

### Measurement and research

- Consent unknown, denial and GPC produce zero optional tags. Page locations and external referrers are reduced before analytics. Unit tests prove local payload construction only.
- DataForSEO pilot: 248 distinct queries, 496 US and UK rows, 203 measured-volume rows, 293 unknown, 20 SERPs with 173 organic items, 22 settled requests and USD 0.22 actual within the USD 5 cap. Frozen cache hash `6a3a1c7569ea2888`. The collection date was 2026-11-02 for US and UK English.
- Ten existing URL priorities were semantically reviewed. Root verified the values and top five URLs. Weekly checks are scheduled for 9, 16, 23 and 30 November at 09:00 Madrid with no top-up or volume requery.
- All 164 bundled RSF values and all 140 available WHR happiness values match downloaded primary data. Only those two metrics are approved for featured and daily-question promotion.
- All 270 claim pages were reviewed. Three stale sitemap URLs were already 404 before this work. No mass deletion was made.

## Real gaps and unknowns

| Gap | Current truth | Required closure |
| --- | --- | --- |
| Final integrated frontend suite | Earlier full run was 153 passes. Ads and analytics added 4 tests each. Later code changed. | Run the final integrated suite and record exact passes, failures and skips. Do not infer a final total. |
| Source-data test cases | Latest isolated worker had 2 skips. Root has the real primary-source fixtures. | Rerun the skipped cases and record the result. |
| Quiz duplicate and point rendering | A final leaf workstream covers legacy duplicate questions and 104 percent treated as points. | Land the final work, then rerun quiz intro, playing, answered and finished. Do not claim fixed before that evidence. |
| Map card framing | A final leaf is changing framing. Existing download dimensions and content are accepted. | Rerun visual card generation and inspect the preview at controlled dimensions. Do not claim fixed before that evidence. |
| Ads | Local preview and denied states correctly show nothing. No network-filled ad was accepted. | Verify a real filled ad in an approved environment. |
| Clipboard | Manual fallback and helper states pass. | Real OS clipboard read remains unproven and should stay documented as such. |
| GA4 | Local consent and payload tests pass. Prior All users data mixes property streams. | Verify the World Truth stream, consent, realtime receipt, cross-domain referral and enhanced-measurement automatic-event privacy and settings. A World Truth-only baseline is required. |
| GSC and external results | A private actual baseline exists outside Git. No external result is implied. | After indexing, measure real indexing and clicks separately from GA4. Do not publish private raw totals. |
| Live commerce | Mock and transaction tests pass. | Run controlled Stripe checkout and webhook verification before enabling live payment. Verify real retry, gift, wallet and provider reconciliation. |
| Reminder delivery | Code and mocked tests pass. Delivery and UI are off. | Configure a trusted HTTPS unsubscribe destination, then verify real opt-in delivery and unsubscribe before enabling UI or delivery. |
| Invalid dynamic routes | Missing route 404 is accepted. Per-family invalid map, embed, country and claim status is not separately recorded. | Include representative invalid dynamic URLs in final approved route smoke. |
| Post-launch outcomes | Nothing has been observed yet. | Measure seven-day further-game completion, confirmed transactions and four-week commission after launch. |

## Rollout sequence

1. Close local evidence. Finish the two final leaves, rerun the isolated source-data cases and run the final integrated frontend suite. Do not publish a final count before this completes.
2. Run final browser QA on the changed quiz and map card states plus representative invalid dynamic routes. Confirm no regression on home, statistic, result, rewards, charts, discoveries, challenge, claims, comparison and privacy.
3. Assemble the user first-review package described below. Root independently accepts the evidence and replaces the pending local statuses with exact results.
4. Obtain separate user decisions for frontend and backend rollout. Approval of one track must not imply approval of the other.
5. Root creates the draft PR and records the final delivery evidence. Do not guess a PR URL. Do not merge, push main or deploy as part of a worker task.
6. For an approved backend track, record the deployment receipt and controlled smoke evidence. Confirm function compatibility before enabling checkout, gifts, wallet transfers, provider callbacks or reminders.
7. For an approved frontend track, record the static export deployment receipt and run route, canonical, 404, sitemap and Open Graph smoke checks.
8. Before mail is enabled, configure a trusted HTTPS unsubscribe destination. Verify real opt-in delivery and unsubscribe end to end. Keep reminder UI and delivery off until both pass.
9. Before payment is enabled, run controlled Stripe checkout and webhook verification. Confirm delayed, duplicate and unpaid cases grant no extra credit. Verify retry, gift and wallet behavior with approved accounts.
10. Before measurement is treated as live, verify the World Truth GA4 stream, consent, realtime receipt, cross-domain referral and enhanced-measurement automatic-event privacy and settings. No account setting change is authorized by this document or the worker.
11. After public launch, inspect GSC indexing and clicks. Measure seven-day further-game completion, confirmed transactions and commission separately for four weeks. Keep consent limits, attribution gaps and reporting delay explicit.

## User first-review package

Review in this order:

1. Desktop and mobile home at 1440x1000 and 390x844. Check the featured source, fallback, map, selected metric, filters, data sources and share.
2. Desktop and mobile statistic at both viewports. Check fact, source, vintage, coverage, limitations, ranking, map, filters, share and card preview. Note that map card framing is still pending final evidence.
3. Desktop and mobile game result after one Truthle and one True or False run. Check score, streak, saved progress, no repeat coin, spoiler-free share, clipboard denial fallback, native cancel, gift preparation and download.
4. Desktop and mobile rewards. Check ordinary offers at any score, non-verified deal wording, merchant removal, friend gift terms, challenge links and no overflow.
5. Remaining route families: country, embed, shop, challenge, charts, discoveries, quiz, claims catalogue and detail, comparison, privacy and missing route. Use the state matrix in `docs/acceptance-checklist.md`.
6. Review the evidence records: `docs/acceptance-checklist.md`, `docs/product-release-review-2026-11-02.md`, `docs/commerce-release-review-2026-11-02.md` and `docs/measurement-acceptance.md`. Treat the older product and commerce reviews as bounded historical reviews, with later repairs noted above.

The package should include root-produced preview URLs or local screenshots when root assembles delivery evidence. This worker does not invent screenshot paths, a PR URL or hosted preview links.

## Source and research limitations

- RSF and WHR are the only matched, promotion-eligible sources. All 164 bundled RSF values and all 140 available WHR values matched. Other metrics may remain browseable but unknown and must not be called verified or used for generated questions.
- WHR coverage is 140 of 164 country records. Missing countries remain unknown rather than zero or invented.
- The claim catalogue has 270 reviewed pages, but 158 need editorial source checks before promotion. Existing uncertain claims stay browseable unless a separate safety decision is made. No mass deletion was performed.
- The DataForSEO pilot is limited to US and UK English on 2026-11-02 and 20 selected SERPs. Volumes are unknown for 293 rows. Pricing and rankings are point-in-time evidence, not guaranteed rankings or traffic.
- Search Console and GA4 are different systems with different scopes and delays. The prior GA4 All users view mixes property streams and cannot attribute all site traffic. Private raw totals must not be published.
- Unit tests with stubbed analytics prove payload construction only. Mocked commerce tests prove code paths, not real payment or provider delivery. Browser QA proves observed states, not production availability.
- No generated claim, score percentile, deal validity, merchant verification, fresh-data claim or live result is inferred from this package.

## Exit criteria for root

- Final integrated test and browser results are recorded without inventing counts.
- The two final leaf workstreams and their three visible issues are either proven in a browser rerun or remain explicitly open.
- Source-data skips are resolved with actual fixtures.
- User review is complete and frontend and backend decisions are recorded separately.
- Draft PR exists if root can create it, with exact final evidence and no guessed URL.
- Every live gate in `docs/acceptance-checklist.md` remains visible until its real environment check passes.
