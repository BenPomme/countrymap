import SwiftUI
import Combine

struct WorldTruthWebScreen: View {
    let route: WorldTruthRoute

    @StateObject private var bridgeHub = WebBridgeHub()
    @EnvironmentObject private var adManager: AdManager
    @EnvironmentObject private var purchaseManager: PurchaseManager

    @State private var isLoading = true
    @State private var errorMessage: String?
    @State private var truthleUserId: String?

    var body: some View {
        VStack(spacing: 0) {
            if let errorMessage {
                errorBanner(message: errorMessage)
            }

            ZStack {
                WorldTruthWebView(
                    route: route,
                    bridgeHub: bridgeHub,
                    onLoadingChanged: { loading in
                        isLoading = loading
                    },
                    onErrorChanged: { error in
                        errorMessage = error
                    }
                )

                if isLoading {
                    ProgressView("Loading \(route.title)…")
                        .padding(16)
                        .background(.thinMaterial)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                }
            }

            if route.allowsBannerAds && !purchaseManager.hasNoAds {
                BannerAdContainer()
                    .frame(height: 50)
                    .background(Color(.systemBackground))
            }
        }
        .onAppear {
            adManager.updateAdsDisabled(purchaseManager.hasNoAds)
            bridgeHub.sendToWeb(
                NativeBridgeEnvelope(type: "app_config", payload: [
                    "platform": .string("ios"),
                    "version": .string(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"),
                ])
            )
            bridgeHub.sendToWeb(
                NativeBridgeEnvelope(type: "entitlement_state", payload: ["adsDisabled": .bool(purchaseManager.hasNoAds)])
            )
        }
        .onChange(of: purchaseManager.hasNoAds) { _, hasNoAds in
            adManager.updateAdsDisabled(hasNoAds)
            bridgeHub.sendToWeb(
                NativeBridgeEnvelope(type: "entitlement_state", payload: ["adsDisabled": .bool(hasNoAds)])
            )
        }
        .onReceive(bridgeHub.$lastWebMessage.compactMap { $0 }) { message in
            handleBridgeMessage(message)
        }
    }

    @ViewBuilder
    private func errorBanner(message: String) -> some View {
        HStack {
            Image(systemName: "wifi.exclamationmark")
            Text("Connection issue: \(message)")
                .font(.footnote)
            Spacer()
            Button("Retry") {
                errorMessage = nil
                isLoading = true
                bridgeHub.sendToWeb(
                    NativeBridgeEnvelope(type: "app_config", payload: [
                        "platform": .string("ios"),
                        "version": .string(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"),
                    ])
                )
            }
            .font(.footnote.bold())
        }
        .padding(8)
        .foregroundStyle(.white)
        .background(Color.red.opacity(0.9))
    }

    private func handleBridgeMessage(_ message: WebBridgeEnvelope) {
        switch message.type {
        case "truthle_state":
            if let userId = message.payload["userId"]?.stringValue, !userId.isEmpty {
                truthleUserId = userId
            }

        case "request_rewarded_retry":
            adManager.showRewardedRetry(userId: truthleUserId, bridgeHub: bridgeHub)

        case "session_completed":
            adManager.maybeShowInterstitial(for: message)

        default:
            break
        }
    }
}
