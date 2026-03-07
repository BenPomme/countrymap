# WorldTruth iOS App Scaffold

This folder contains a SwiftUI iOS implementation scaffold for the embedded-web architecture:

- SwiftUI shell + WKWebView feature tabs (`Map`, `Charts`, `Discoveries`, `Quiz`, `Truthle`, `Shop`)
- JavaScript bridge over `window.webkit.messageHandlers.worldTruthBridge`
- Native monetization plumbing:
  - AdMob banner/interstitial/rewarded
  - StoreKit 2 one-time no-ads purchase (`com.theworldtruth.noads.lifetime`)

## Required Xcode Setup

1. Create an iOS App target (`iOS 16+`) named `WorldTruth`.
2. Add all `.swift` files from this folder into the target.
3. Add Swift Package dependencies:
   - `https://github.com/googleads/swift-package-manager-google-mobile-ads`
4. Enable capabilities:
   - In-App Purchase
5. Configure Info.plist:
   - `GADApplicationIdentifier` = your AdMob app ID
   - `NSAppTransportSecurity` if needed for test endpoints
6. Replace test ad unit IDs in `Config/AppConfig.swift`.

## Web Bridge Contract

Web -> iOS messages (implemented):
- `route_changed`
- `session_completed`
- `request_rewarded_retry`
- `truthle_state`
- `retry_status_changed`
- `retry_consumed`

iOS -> Web messages (implemented):
- `entitlement_state`
- `rewarded_result`
- `app_config`

## Backend Expectations

Deploy Firebase functions and rules from repo root:

```bash
firebase deploy --only functions,firestore:rules
```

The iOS reward flow expects these cloud functions:
- `admobRewardedSSV`
- `getTruthleRetryStatus`
- `consumeTruthleRetry`

## Notes

- Offertoro is intentionally omitted in embedded iOS mode.
- AdSense is disabled when `?embedded=ios` is active.
- Interstitial frequency cap is enforced at 3/day (UTC).
