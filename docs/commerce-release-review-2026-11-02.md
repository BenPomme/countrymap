# Commerce release-gap review, 2 November 2026

Status: review complete. Two actionable defects are confirmed, both affecting reminders before live delivery is enabled. No other contract-level source defect was found in the reviewed commerce ranges.

## Scope

Independent read-only review of the commerce handlers and existing tests against `docs/growth-contract.md`. Covered areas: checkout verification, payment return spoofing and delayed duplicate webhooks; atomic idempotent retry debit and lost-response receipts; gift validation; callback credit plus marker atomicity; server-owned reward prices; wallet duplicate and lost-response claims; reminder opt-out and unsubscribe protections.

No application edits, tests, builds, browser/server work, network calls, live actions, credential reads or private extracts were performed.

## Inherited evidence

- Coordinator reports 153 frontend/data tests, 63 backend tests, 47 Python SEO tests, full typecheck and a production build/metadata pass at `865d53c` with 659 HTML files and 552 indexable pages.
- These are local mocked checks only. They do not prove a production release, real payment/email delivery or a GA4 receipt.
- The earlier all-repo review produced no artifact and reported local `task_budget_refused`; its raw history is unavailable and is not reused.

## Confirmed defects

### 1. Generated reminder unsubscribe links cannot reach the unsubscribe handler

Severity: high before reminders are enabled. No current live-mail impact because delivery is disabled.

- `functions/lib/reminders.js:260` generates `https://theworldtruth.com/truthle/?unsubscribe=<token>`.
- `functions/index.js:136` expects the HTTP parameter `token`, not `unsubscribe`.
- No frontend code handles `?unsubscribe=...`, and the generated URL does not point at `unsubscribeRemindersLink`. A recipient clicking the link lands on the normal Truthle page without changing reminder state.
- `functions/test/reminders.test.js:139` extracts the token from the URL and calls the pure handler directly. It does not exercise the generated URL through the HTTP entry point, so the broken contract is not covered.
- Action: generate a link to the deployed unsubscribe endpoint or add a frontend consumer, and use one parameter name end to end. Add a mocked route-level check for the generated URL before enabling reminders.

### 2. Reminder opt-in does not verify the email address

Severity: medium before reminders are enabled. Reminders are disabled and the current preference UI makes no delivery promise, so this is not a live-mail defect today.

- `functions/lib/reminders.js:104-108` reads `context.auth.token.email` and only checks that it is a plausible string. It does not require `context.auth.token.email_verified === true`, although its error says a verified account email is required.
- `functions/test/reminders.test.js:126` is named `email preference updates require authentication and a verified email for opt-in`, but its test contexts contain no verification flag and it only covers a missing email. The claimed verification behavior is not tested.
- Action: require the verified flag or remove the verification claim and test name. Cover both unverified and verified tokens if the check is retained. Resolve this before enabling reminder delivery.

## Coverage

All listed checks use local fakes (`FakeFirestore`, `createFakeStripe`) rather than live Stripe, provider, email or GA4 services.

| Area | Source | Existing tests | Result and proof limit |
| --- | --- | --- | --- |
| Gift checkout validation and reservation | `functions/lib/checkout.js:76-303`, `functions/lib/promos.js:65-190` | `share checkout requires quantity one and validates code product, expiry and issuer`; `share checkout rejects self, wrong product, wrong discount, expired and redeemed codes`; `an active share reservation is reused instead of creating another checkout`; `a legacy active reservation without an expiry is reused only by its recipient`; `expiry releases the same recipient share reservation for a fresh checkout`; `acceptance: gift checkout rejects expired, self, and wrong-product codes before checkout` | Bound to one discounted attempt, with self, product, coupon, expiry and redemption checks before checkout. Mocked only. |
| Checkout return and ownership | `functions/lib/checkout.js:137-155`, `functions/lib/checkout.js:305-361`, `src/lib/truthle/commerce.ts:123-141` | `checkout status is owner-only and only a durable grant is fulfilled`; `checkout status reports trusted expired and unpaid-failed states`; `acceptance: checkout status rejects unauthenticated and non-owner callers` | Status is based on the authenticated owner, stored session and Stripe session. A return query alone cannot fulfill credits. Mocked only. |
| Stripe grant and delayed duplicates | `functions/lib/checkout.js:363-513`, `functions/index.js:116-126` | `webhook grant is idempotent even when duplicate deliveries race`; `a paid webhook without payment does not grant credits`; `a delayed webhook for an earlier expired gift session still grants once`; `a delayed gift webhook completes an expired local reservation atomically once`; `an expired webhook cannot regress a fulfilled session`; `webhook verification and configuration fail closed`; `acceptance: delayed paid webhook grants once and duplicate delivery is idempotent` | Signature and payment checks precede a transaction keyed by session ID; credit, session state and gift redemption commit atomically. Mocked only. |
| Retry debit and receipts | `functions/lib/retries.js:69-145` | `paid retry consumes once and replays the durable receipt`; `concurrent retries with the same request id debit only once`; `a lost retry response can be replayed after UTC midnight`; `legacy calls without a request id replay a free daily retry safely`; `legacy calls without a request id cannot debit paid credits`; `acceptance: consumed retry request id keeps one durable receipt across dates and races` | Request-scoped transaction writes the debit and receipt together; replay returns the stored result. Mocked only. |
| Wallet claims, prices and redemption | `functions/lib/wallet.js:31-142`, `functions/lib/catalogue.js:3-46`, `src/lib/truthle/rewards.ts:1-323` | `wallet claim is atomic, replay safe and preserves its lost response`; `concurrent wallet claims with one request id return one durable result`; `wallet claims are scoped to the authenticated owner and require a stable id`; `redemption uses the server catalogue price instead of a forged client price`; `redemption replay after a lost response does not debit twice`; `unknown, cash-like and gift-card rewards fail before any debit`; `insufficient funds and request-id reuse fail without changing the wallet` | Claim receipt and zeroed wallet commit together; redemption uses the server catalogue and transaction receipt. The checked-in server prices currently match `rewards.ts` by manual comparison. Mocked only. |
| Provider callback credit and markers | `functions/lib/providers.js:30-177` | `Offertoro credits a valid postback exactly once across duplicate deliveries`; `Offertoro duplicate marker credit stays atomic and does not trust a changed amount`; `AdMob grants one daily retry and records its marker in the same transaction`; `AdMob duplicate and concurrent callbacks do not grant twice`; `AdMob caps a second distinct daily transaction without a second grant`; `acceptance: Offertoro callback auth and finite amount fail closed, duplicates credit once`; `acceptance: AdMob callback auth and finite amount fail closed, duplicates grant once` | Authentication and amount validation precede a transaction that writes the provider marker and entitlement or wallet balance together. Mocked only. |
| Reminder opt-out, duplicate queueing and disabled mode | `functions/lib/reminders.js:95-273`, `functions/index.js:128-147` | `the reminder scheduler queues nothing while delivery is disabled`; `enabled reminders write one deterministic mail receipt per user and day`; `concurrent scheduler runs still enqueue only one mail for the day`; `played, disabled and malformed subscribers receive no reminder`; `opting in creates an opaque token while keeping token state server-only`; `an opaque unsubscribe token disables reminders and replays safely`; `invalid and malformed unsubscribe links fail closed` | Queueing is off by default, one receipt is keyed per user and day, token use is idempotent, and the state change is transactional. The generated link and verified-email gaps above remain. Mocked only. |

## Contract conclusions

- Checkout completion is server verified. Return query values do not grant credits, owner checks reject cross-account status reads, and a completed but unpaid session is not fulfilled.
- Duplicate and delayed webhooks grant once because the durable session grant, wallet credit, local fulfilment and gift redemption are in one transaction.
- Gift validation covers issuer, recipient, single use, expiry, discount, product and coupon association. There is no separate game field in gift or claim records; `returnTo` only selects the success and cancel page. The contract defines one Extra Attempt product and a shared entitlement, so cross-game rejection would introduce a new product split rather than fix an identified defect.
- Retry consumption, wallet claims, redemption and provider rewards preserve the existing economy and transaction-bound receipt semantics.
- Reminder delivery remains disabled by default. Opting out and duplicate queueing are idempotent, but the generated unsubscribe route and the unverified email gap must be fixed before enabling mail.

No other contract-level source defect was identified in the reviewed ranges. This is not an exhaustive reread of every source or test file.

## Remaining release gates

- Independent coordinator acceptance.
- Approved deployment and production smoke verification.
- Real Stripe payment, webhook delivery, retry debit, gift, wallet and reminder/email checks in a controlled live environment.
- GA4 receipt verification after consent-aware delivery.

