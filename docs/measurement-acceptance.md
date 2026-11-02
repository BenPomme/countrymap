# Measurement acceptance

Date: 2026-11-02. Scope: the existing GA4 and Google Ads identifiers are unchanged. No pricing, credit, reward or other economy behavior changes are part of this measurement work. This document contains no private analytics baseline values.

## Privacy and transport

- Consent must be explicitly granted for analytics. Unknown consent, denied consent, Global Privacy Control and any environment other than the exact HTTPS production hosts produce zero analytics events and zero page views.
- `page_location` is limited to the current public origin and pathname. Query strings, fragments and credentials are removed.
- Every external referrer is reduced to its safe HTTP(S) origin. Referrer pathnames, queries, fragments and credentials are never added to config, global or custom event payloads.
- Exact `https://checkout.stripe.com` and `https://billing.stripe.com` origins set `ignore_referrer: true`. Lookalike hosts and non-HTTPS or alternate-port variants do not. A referrer containing credentials is ignored rather than partially parsed.
- GA4 config keeps `send_page_view: false`. The site sends its own page views only after allowed consent and route changes. Ads config also keeps `send_page_view: false`.
- The Google tag bootstrap is the standard dataLayer shim. No `window.gtag` wrapper is treated as a privacy control, because GA4 enhanced measurement can send through tag internals without passing through that wrapper.
- Unit tests with stubbed `gtag` calls prove payload construction only. They are not proof of browser or production transmission. Runtime network QA in an approved preview is required.

## Prerelease gate: exact GA4 property

Before preview approval, the coordinator must verify the exact GA4 property and web data stream used by the preview. No GA4 account setting change is made by this task or authorized before preview review.

The verification must record the current Enhanced measurement master switch and every individual setting: page views, scrolls, outbound clicks, site search, video engagement, file downloads and form interactions. It must also record the observed requests or DebugView events for consent denied, GPC, an external referrer with a private path, a Stripe return and a normal consented page. This inspection must show whether any automatic event can carry a full external URL or a private path. If it can, the property change is a separate reviewed action with before and after evidence. No wrapper behavior is accepted as a substitute for this verification.

## Metric definitions

### Game starts and completions

- A game start is a `game_start` event for `truthle` or `true-false`, grouped by UTC `puzzle_day` and `placement` when present.
- A game completion is a `game_complete` event emitted after a run is finalized. Extra attempts are separate completions and are identified by `placement` when available.
- Completion rate uses sessions with at least one matching `game_start` on a UTC puzzle day as the denominator and sessions with at least one matching `game_complete` as the numerator. Multiple completions in one session do not increase that session numerator.
- `referral_game_complete` is a referral activation signal and is not added to ordinary `game_complete` counts.

### Recipient open and completion activation

- A valid recipient open is a session with `referral_open` that carries safe `game` and `puzzle_day` parameters. Invalid challenge links have no safe game/day parameters and are excluded from this metric.
- Recipient completion activation uses sessions with a valid `referral_open` for a game and UTC puzzle day as the denominator. The numerator is those sessions with a matching `referral_game_complete` for the same game and puzzle day.
- Gift codes, recipient identity and checkout session details are not used to join or report this metric. Cross-session matching is not inferred.

### Seven-day return cohort

- Cohort day D is a UTC day. The denominator is users with at least one `game_complete` on D.
- A returning user is a denominator user with at least one measured site event during D+1 through D+7 inclusive. The observation window closes at 23:59:59 UTC on D+7.
- Report the cohort only after its full window closes. Use GA4 user-scoped reporting for consenting users only, and state that the result does not represent non-consenting or cross-device activity.

### Affiliate clicks, transactions and commissions

- `affiliate_click` is a click or link activation on an affiliate placement. It is not a visit, transaction, sale or commission.
- A confirmed transaction is a completed purchase confirmed by the relevant partner or backend reconciliation. Client `checkout_return`, URL state, `checkout_start` or an unverified `purchase` event cannot make a transaction confirmed.
- A commission is the partner-reported booked or approved amount, net of reversals only when the partner report provides that accounting. It is never estimated from clicks, product price or an unverified event.
- Clicks, confirmed transactions and commissions stay as separate counts. Any click-to-transaction rate is reported only where the partner reconciliation supports attribution; missing attribution stays unknown.

### Search Console clicks

- Search Console clicks are clicks from Google Search results reported by the verified Search Console property. They are distinct from GA4 sessions, GA4 page views, affiliate clicks and confirmed transactions.
- Search Console reporting keeps its own date range, property scope and reporting delay. It is not merged into or used to backfill GA4 event counts.

