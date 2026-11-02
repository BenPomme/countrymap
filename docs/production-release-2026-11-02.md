# Production release, 2 November 2026

The user approved the reviewed site for deployment, then explicitly requested that the Firebase backend remain pending. This record supersedes the pre-approval status in the earlier release review.

## Public site

PR #8 was merged at commit `009e1a153cf2e02582e7be2179d2298634169164`. GitHub Pages run [41507022859](https://github.com/BenPomme/countrymap/actions/runs/41507022859) passed build and deployment. The redesigned homepage, statistic pages, daily games, rewards hub and challenge landing are live at [theworldtruth.com](https://theworldtruth.com/).

A direct production check found all 552 sitemap URLs return 200, with five invalid route families returning real 404 responses. Fifteen representative pages passed metadata, canonical and discontinued-merchant checks. The initial check found the home sharing image dimensions differed from its metadata; this is being corrected in the release follow-up. HTTP checks do not prove search indexing or traffic growth.

## Backend and commerce

The backend upload was rejected before source upload because the cloud project has no eligible linked billing. No hardened functions or Firestore rules were released. The user selected “Leave the backend pending for now”. No billing plan, payment or top-up was changed.

The frontend follow-up defaults `NEXT_PUBLIC_TWT_SERVER_COMMERCE_READY` to false. Keep checkout, new friend gifts, retry consumption, wallet transfers and reward purchases unavailable until the hardened backend and rules are deployed and independently verified. Existing balances, owned items, saved progress, ordinary sharing, affiliate picks and free daily play are preserved. The flag is not an authorization to activate commerce.

Reminder delivery and provider reward activation remain off. Real checkout fulfillment, provider callbacks and reminder delivery remain unverified. Existing tests cover mocked transaction behavior and do not establish live fulfillment.

## Measurement

Controlled live analytics events reached the existing World Truth GA4 stream. Optional requests were absent with consent rejected. Allowed events used query-free page locations and reduced external referrer origins. Enhanced automatic measurement was disabled for this stream so the manual consent-aware event controls govern it. A first-load referral timing defect was found and repaired for the follow-up. Production browser verification of that repair is pending. Private account extracts and network evidence remain outside Git.

GPC has meaningful local test coverage, but live browser emulation was unavailable in the current browser controls. Controlled QA events are not organic traffic, commercial conversion or proof of a traffic improvement. Four-week SEO monitoring remains scheduled against the existing capped DataForSEO pilot.

## Follow-up validation

The integrated follow-up passed all 191 frontend/data tests with zero failures or skips. Its production build, type checking and metadata audit passed, covering 659 HTML pages, including 552 indexable pages and 106 noindex embeds. The only lint diagnostic is the previously recorded image optimization warning. A fresh local HTTP check passed every sitemap URL, representative route, missing route and sharing image sample.

The preview retained the saved 130-coin balance and the existing 567-point daily result. All 23 shop purchase controls were disabled; the ordinary result sharing controls remained enabled. The shop and daily result had no horizontal overflow. The home/general sharing asset is now reproducibly rendered at 1200x630 at its existing URL.

Deployment and final live referral verification of this follow-up are recorded separately after the Pages workflow completes.
