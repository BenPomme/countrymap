# Growth implementation acceptance

Date: 2026-11-02. Status: implementation and independent review in progress.

## Product surface

| Surface | Required evidence | Status |
| --- | --- | --- |
| Home | Sourced eligible fact, Play today, Explore maps, Rewards & codes, selected metric restoration | Pending integration |
| Map statistic | Fact, map, source, vintage, coverage, limitations and share action near top; filters survive link | Pending integration |
| Country | Unique canonical and metadata, neutral rankings, shared navigation | Pending integration |
| Truthle | Start, answer, completion, missed days, UTC rollover, retry and saved progress | Pending integration |
| True or False | Same lifecycle, source eligibility, saved progress and shared date | Pending integration |
| Game result | Spoiler-free square card, truthful share outcomes, explicit gift mint, no invented percentile | Pending integration |
| Rewards | Ordinary recommendations visible at all scores, accurate affiliate disclosure, merchant incentive fully removed | Correction in progress |
| Challenge | Valid, invalid, future, past-day and expired gift contexts; no mint or consumption on open | Pending integration |
| Coin shop | Existing prices and owned inventory preserved; non-duplicating wallet claim | Pending integration |
| Charts and discoveries | URL-restored context, loading/empty/error states, shared style | Pending integration |
| Quiz | Eligible sourced questions, completed/empty states, no unsupported percentile | Pending integration |
| Claim pages | Catalogue and all generator branches reviewed; concrete conclusions distinguished from unsupported claims | Independent audit running |
| Privacy and consent | Correct canonical, keyboard access, unknown/denied analytics sends nothing | Pending integration |

## Commerce and lifecycle

| Boundary | Required evidence | Status |
| --- | --- | --- |
| Stripe | Server-owned return state, authenticated session ownership, delayed and duplicate webhook, one credit grant | Pending integration |
| Retry consumption | Stable request ID, concurrent/duplicate debit and lost response replay | Pending integration |
| Gift redemption | Invalid, expired, self-redeemed, redeemed, wrong product/game, duplicate request | Pending integration |
| Reward callback | Secret required, finite amount, atomic duplicate marker and credit | Pending integration |
| Wallet transfer | Atomic claim and durable replay response, no repeat local grant | Pending integration |
| Redemption | Server catalogue prices, unsupported fulfillment fails closed | Pending integration |
| Reminder | Disabled unless delivery, duplicates and unsubscribe all verified; no live email test without separate authorization | Pending integration |

## Release review

- [ ] Dependency install, type check, lint and meaningful unit/transaction tests pass.
- [ ] One production export passes; generated routes and metadata checked across the full catalogue.
- [ ] HTTP checks prove a real 404 and preserve existing paths.
- [ ] Browser review covers mobile and desktop home, stat, game result and rewards first, plus each remaining route family.
- [ ] Sharing dialog keyboard/focus/escape and capture/copy/cancel/failure states are checked.
- [ ] No Lien & Cie, lienetcie, TRUTHLE10 or replacement merchant-bonus teaser remains in production source or generated output.
- [ ] Private account/GA4/Search Console extracts and credentials are absent from Git and worker briefs.
- [ ] Reviewable preview, screenshots and draft PR exist before a production decision.
- [ ] Backend deployment, live Stripe fulfillment, merchant commissions and actual search/return-visit results remain separately identified.

## Research pilot

- [x] Existing DataForSEO credits checked locally without top-up.
- [x] Current primary pricing and one-task-per-live-request requirement reviewed by coordinator.
- [x] Pilot runner independently accepted before paid collection; 47 Python tests passed.
- [x] 248 distinct queries, 496 US/UK English combinations cached. 203 measured-volume rows, 293 unknown. Actual volume charge USD 0.18; 20 SERPs USD 0.04; total USD 0.22, no unresolved reservation.
- [ ] Twenty selected SERPs inspected for intent, competition, freshness and usefulness.
- [ ] Ten existing URL priorities carry real evidence and concrete changes.
- [ ] Four weekly selected-keyword rank checks share the same USD 5 pilot ledger and finite end date.
- [x] Search Console and GA4 baselines retained outside Git; third-party estimates remain separate from observed clicks/indexing.
