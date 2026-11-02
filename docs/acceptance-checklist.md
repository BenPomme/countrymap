# Growth implementation acceptance

Updated: 2026-11-02. Source checkpoint: `61e91c2613663ce65e4bd9c187b2c6d0e178200c`.

This is a release evidence record, not a deployment claim. It uses coordinator-supplied local, mock and browser evidence plus public source inspection. It contains no private analytics totals or credentials.

## Status labels

- **Local accepted**: accepted local source, test, build, mock or browser evidence. It is not production confirmation.
- **Pending rerun**: behavior has earlier evidence, but later integrated changes require a fresh run.
- **Production gate**: requires an approved live account, deployment, network or external service check.
- **Post-launch**: can only be measured after real traffic, indexing or transactions.
- **Not proven**: no evidence supports the claim.

## Route family and state coverage

| Route family | States and contract covered | Evidence status | Remaining proof |
| --- | --- | --- | --- |
| Sitewide shell and preferences | Header, footer, main navigation, consent unknown/allowed/denied/GPC, footer privacy dialog, analytics and ad gating, skip link, mobile layout | Local accepted. The footer opens the actual privacy dialog. Unknown and denied consent send nothing. WhatsApp remains the primary share action. | Final integrated browser rerun. Exact production GA4 receipt and enhanced-measurement behavior remain production gates. |
| Home `/` | Map loading, eligible featured fact, no-eligible-fact fallback, selected metric restore, active and no-match filters, mobile filter dialog, data sources dialog, copy success and failure | Local accepted. Both viewports had no overflow. Source promotion is fail-closed. | Final integrated rerun after the last source changes. |
| Statistic `/map/[slug]/` | Valid and unknown slug, ranking values and no-value rows, source/vintage/coverage/limitations, neutral legend, filter URL restore, mobile filter drawer, share action, embed snippet | Local accepted. Source, share and map are near the first screen. Card download produced 1200x630. | Map card framing is being changed by a final leaf. Pending final browser rerun. Per-family invalid-slug HTTP status is not separately recorded. |
| Embedded map `/embed/[slug]/` | Valid and unknown slug, noindex, embedded shell, map interaction, canonical to the full map | Build/metadata accepted. The build produced 106 noindex embeds. Invalid source path uses not-found handling. | Dedicated embedded interaction and per-family invalid-slug HTTP rerun are not in the final browser evidence. |
| Country `/country/[slug]/` | Generated country pages, unrecognized-country fallback, one H1, rankings, source states, share, neutral presentation | Local accepted for France layout and one H1. Catalogue metadata built for all generated pages. | Final representative rerun for ranking, source and share states. Per-family invalid-slug HTTP status is not separately recorded. |
| Truthle `/truthle/` | Loading, ready/intro, playing, answered, result, unavailable, error, saved progress after reload, UTC rollover, missed day, no repeat coin, Extra Attempt and checkout banner | Local accepted. Browser showed 4 of 5, score 567, streak 1, 130 coins persisted after reload. Mock and helper tests cover rollover, replay, retry and checkout states. | Final integrated browser rerun. Controlled live checkout remains a production gate. |
| True or False `/true-false/` | Loading, intro, playing, done, unavailable, error, saved progress after reload, UTC day, retry and shared gift entry | Local accepted. Browser showed 3 of 5 and streak 1 persisted after reload. Shared lifecycle tests cover the game. | Final integrated browser rerun. Controlled live checkout remains a production gate. |
| Game result and share state inside both games | Spoiler-free result card, replayed result, gift preparation and cancellation, share dialog, focus wrap, Escape return, clipboard success/denial, manual URL fallback, native cancellation/failure, image download | Local accepted. Actual downloaded cards were map 1200x630 and game 1080x1080. Clipboard denial produced an exact game/day challenge URL with no spoilers. | Real OS clipboard read is not proven. Final browser rerun remains open. |
| Coin shop `/truthle/shop/` | Loading, load error, cloud sync syncing/synced/error, retry, owned items, insufficient coins, success and error messages, empty category, server-priced redemption | Local accepted. A failed sync preserved 130 coins and showed an error plus retry. Mock tests cover atomic claims, replay and server prices. | Final integrated rerun and approved backend deployment. Real account and payment behavior remain production gates. |
| Rewards `/rewards/` | Ordinary recommendations at every score, disclosure that deals are not verified discounts, friend gift terms, coin and challenge links | Local accepted. Both viewports had no overflow. No discontinued-merchant reference remains among 212 production paths. | Final integrated rerun. Affiliate transaction and commission outcomes remain post-launch evidence. |
| Challenge `/challenge/` | Current day, valid code entry, invalid game, invalid day, malformed code, past day and future day. Opening does not mint, redeem or call the network. Expired, self, redeemed and wrong-product codes fail in mocked checkout. | Local accepted for current, past, future and invalid contexts. Browser observed zero mint, redeem and network actions on open. | Final integrated rerun. Live gift redemption and expiry behavior require approved backend verification. |
| Charts `/charts/` | Loading, correlation, ranking, scatter and distribution views, no-value state, chart/axis/filter URL restore, share provenance, ad slots | Local accepted. Browser restored axes and filters from the URL. No-value copy exists in source. | Final integrated rerun. A real filled ad is a production gate. |
| Discoveries `/discoveries/` | Loading, populated list, empty filter result, recovery-filtered pair, selected pair dialog restore, URL state and share | Local accepted. Empty and recovery-filtered pair states plus dialog restore were exercised. | Final integrated rerun. |
| Quiz `/quiz/` | No eligible questions, intro, playing, answered, finished, score display, completion event and share copy | Earlier browser states accepted. Source notes and sourced defaults now sit in the current source. Duplicate legacy questions and 104 percent rendered as points remain under final repair. | The final leaf work and browser rerun are pending. Do not claim either issue fixed. No unsupported percentile is allowed. |
| Claims catalogue and detail `/true-false/claims/`, `/true-false/claims/[slug]/` | Catalogue, valid detail, missing detail, source/vintage/coverage, limitations, editorial-review warning, related claims and game links | Source and metadata accepted. All 270 pages were audited. Invalid detail uses not-found handling. | 158 pages need editorial source checks before promotion. Final browser sampling and per-family invalid-slug HTTP status remain open. |
| Comparison `/truthle-vs-worldle/` | Static comparison content, game links, canonical, Open Graph and no affiliation claim | Build/metadata and source accepted. | Final browser rerun and sample metadata output check remain open. |
| Privacy `/privacy/` | Analytics and advertising explanation, unknown/allowed/denied choices, GPC, withdrawal, local storage explanation, footer preference entry | Local accepted. Consent unknown and denied load no optional tags. Actual dialog opens from the footer. | GA4 property, enhanced measurement and AdSense settings require an approved production gate. |
| Missing route and route outputs | Missing page returns 404; sitemap, canonical paths, noindex embeds and Open Graph assets | Local accepted. All 552 sitemap URLs returned 200, the missing route returned 404, 109 Open Graph paths were present and 108 cards were generated. | Final post-deployment route smoke after approved rollout. |

## Build, test and source evidence

| Evidence | Accepted result | Limit |
| --- | --- | --- |
| Production build and metadata | Passed at `865d53c`; later Next build plus metadata run at `8608066` produced 659 HTML files, 552 indexable pages and 106 noindex embeds. | Local static output, not a deployment. |
| Frontend tests | Original full run: 153 passes. Ads added 4 focused tests. Analytics added 4 focused tests. | Later integrated changes require a final full rerun. No final total is asserted. |
| Isolated worker tests | 140 passes and 2 source-data skips. | Skips are not passes. Root has the actual primary-source fixtures and will rerun them. |
| Backend tests | Latest leaf: 66 of 66 passed after verified reminder opt-in and unsubscribe contract fixes. | Mocked Stripe, email, provider and Firestore boundaries. Not live action. |
| Python SEO tests | 47 of 47 passed at root. | Local tooling evidence only. |
| Type and dependency checks | Full typecheck passed. Lint has one unchanged preview-image warning. Clean locked `npm ci` installed 541 packages. | The warning is not a new failure and was not silenced. |
| Source hygiene | No discontinued-merchant reference among 212 production paths. No private files among 345 tracked files. | Secret scanning is not a substitute for credential rotation or production review. |
| Data provenance | All 164 bundled RSF values and all 140 available WHR happiness values match downloaded primary data. | Only RSF and WHR are approved for featured and daily-question promotion. Other metrics remain browse-only where unverified. |

## Commerce and lifecycle

| Boundary | Accepted evidence | Release status |
| --- | --- | --- |
| Stripe checkout | Mocked coverage for missed UTC day, duplicate concurrent requests, lost response, checkout owner checks, spoofed return state, delayed and unpaid webhooks, duplicate webhooks and one credit grant | Production gate. Run controlled Stripe checkout and verify webhook delivery before enabling live payment. |
| Retry consumption | Stable request ID, concurrent debit protection, one durable receipt and lost-response replay | Mocked accepted. Production gate with the approved backend. |
| Friend gift | One shared Extra Attempt across both games. Mocked rejection covers expired, self-redeemed, already redeemed, wrong product, duplicate request, wrong discount and coupon mismatch. | Mocked accepted. Live redemption remains a production gate. |
| Provider callback | Required secret, finite amount, atomic marker and credit, duplicate and concurrent delivery | Mocked accepted. Real provider reconciliation remains a production gate. |
| Wallet claim | Authenticated owner, atomic claim, durable replay response and no repeat local grant | Mocked accepted. Account-level live verification not performed. |
| Redemption | Server-owned catalogue price, insufficient-funds handling, unsupported fulfillment fails closed and replay does not debit twice | Mocked accepted. Existing prices and owned inventory are preserved in local checks. |
| Reminder | Delivery and UI default off. Verified email required for opt-in; opt-out permits unverified. Generated unsubscribe route, parameter contract and replay tests were repaired. | Production gate. Configure a trusted HTTPS unsubscribe destination and verify real delivery plus unsubscribe before enabling UI or delivery. Mocked mail is not delivery. |

## Release gates

- [x] Local typecheck, focused tests, production export, sitemap/HTTP check and card generation have accepted evidence.
- [x] Core desktop and mobile browser review covers home, statistic, result and rewards without overflow.
- [x] Source and generated output contain no discontinued-merchant reference.
- [x] All 164 bundled RSF values and all 140 available WHR values match primary data.
- [x] Ten existing URL priorities have accepted evidence and verified top URLs.
- [ ] Final integrated frontend rerun. No final test total may be inferred before this completes.
- [ ] Rerun the 2 source-data cases with root fixtures and record the result.
- [ ] Final leaf repair and browser rerun for quiz duplicate questions, 104 percent as points and map card framing. These are not fixed claims.
- [ ] User review of desktop and mobile home, statistic, result and rewards, followed by separate frontend and backend rollout approval.
- [ ] Root-created draft PR and final delivery evidence. No guessed PR URL, merge, main push or deploy.
- [ ] Real network-filled ad state. Preview and denied states already show no ad and no fake placeholder.
- [ ] Trusted HTTPS unsubscribe configuration plus real opt-in delivery and unsubscribe verification before enabling reminders.
- [ ] Controlled Stripe checkout and webhook verification before live payment.
- [ ] GA4 World Truth stream, consent, realtime, cross-domain referral and enhanced-measurement automatic-event privacy and settings verification. No account change was made.
- [ ] GSC indexing and clicks, seven-day further-game completion, confirmed transactions and four-week commission measurement after launch.

## Research and measurement

| Item | Accepted evidence | Limit or gate |
| --- | --- | --- |
| DataForSEO pilot | 248 distinct queries, 496 US and UK rows, 203 measured-volume rows, 293 unknown, 20 SERPs with 173 organic items, 22 settled requests and USD 0.22 actual within USD 5. Frozen cache hash `6a3a1c7569ea2888`. | Collection date is 2026-11-02 for US and UK English. Unknown volume stays null or unknown, not estimated. Pricing and rank are point-in-time, with no rank guarantee. |
| Existing URL priorities | Ten existing URLs semantically reviewed. Root verified values and the top five URLs. | Priorities are not traffic promises or guaranteed rankings. |
| Weekly monitor | Scheduled for 9, 16, 23 and 30 November at 09:00 Madrid with no top-up or volume requery. | Four-week observation is not complete. No external result is implied. |
| Claim audit | 270 unique pages reviewed. Three stale sitemap URLs were already 404 before this work. | 158 pages need editorial source checks before promotion. No mass deletion was made. |
| GSC baseline | A private actual baseline exists outside Git. | Do not publish raw private totals. Real indexing and clicks are post-launch evidence. |
| GA4 baseline | Prior All users data mixes property streams and cannot attribute all site traffic. | A World Truth-only filter is required before an exact baseline. Do not use mixed totals as site results. |
| Measurement privacy | Unknown, denied and GPC consent load no optional tags. URLs and external referrers are reduced before analytics. | GA4 enhanced-measurement automatic events, privacy and property settings still require production verification. |

## Evidence boundaries

- This checklist does not establish production deployment, external indexing, real payment, email delivery, ad fill, affiliate commission or a GA4 receipt.
- No live gift mint, payment, email, provider callback or analytics event was invoked during the accepted QA.
- Real OS clipboard reading is not proven. The manual exact-URL fallback and helper behavior are accepted.
- No score percentile, deal validity, merchant verification, freshness or search ranking is inferred from local evidence.
