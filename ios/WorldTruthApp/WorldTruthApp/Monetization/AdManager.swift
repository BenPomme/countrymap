import Foundation
import Combine
import GoogleMobileAds
import UIKit

@MainActor
final class AdManager: NSObject, ObservableObject {
    @Published private(set) var adsDisabled = false
    @Published private(set) var canServeAds = false

    private let capStore = InterstitialCapStore()

    private var interstitial: InterstitialAd?
    private var rewarded: RewardedAd?

    private var interstitialCompletion: (() -> Void)?
    private var rewardedCompletion: ((NativeBridgeEnvelope) -> Void)?
    private var rewardedEarned = false

    func bootstrap(adsDisabled: Bool) {
        self.adsDisabled = adsDisabled

        guard let applicationID = Bundle.main.object(forInfoDictionaryKey: "GADApplicationIdentifier") as? String,
              !applicationID.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            canServeAds = false
            print("AdMob disabled: missing GADApplicationIdentifier in Info.plist")
            return
        }

        canServeAds = true
        MobileAds.shared.start(completionHandler: nil)
        Task {
            await loadInterstitial()
            await loadRewarded()
        }
    }

    func updateAdsDisabled(_ disabled: Bool) {
        adsDisabled = disabled
    }

    func maybeShowInterstitial(for message: WebBridgeEnvelope) {
        guard canServeAds else { return }
        guard !adsDisabled else { return }
        guard capStore.canShowNow() else { return }

        guard message.type == "session_completed" else { return }
        let payload = message.payload
        let sessionType = payload["sessionType"]?.stringValue ?? ""
        let route = payload["route"]?.stringValue ?? ""
        let reason = payload["reason"]?.stringValue ?? ""
        let durationMs = payload["durationMs"]?.doubleValue ?? 0

        let isNaturalBreak =
            sessionType == "quiz" ||
            sessionType == "truthle_primary" ||
            (sessionType == "route" && (route.contains("/charts") || route.contains("/discoveries")) && reason == "route_change" && durationMs >= 120_000)

        guard isNaturalBreak else { return }
        guard let viewController = UIApplication.shared.topMostViewController() else { return }
        guard let interstitial else {
            Task { await loadInterstitial() }
            return
        }

        interstitialCompletion = { [weak self] in
            self?.capStore.recordDisplay()
            Task { await self?.loadInterstitial() }
        }
        interstitial.present(from: viewController)
    }

    func showRewardedRetry(userId: String?, bridgeHub: WebBridgeHub) {
        guard canServeAds else {
            bridgeHub.sendToWeb(
                NativeBridgeEnvelope(type: "rewarded_result", payload: [
                    "status": .string("failed"),
                    "reason": .string("Rewarded ads are unavailable on this build"),
                ])
            )
            return
        }

        guard let viewController = UIApplication.shared.topMostViewController() else {
            bridgeHub.sendToWeb(
                NativeBridgeEnvelope(type: "rewarded_result", payload: ["status": .string("failed"), "reason": .string("No active view controller")])
            )
            return
        }

        guard let rewarded else {
            bridgeHub.sendToWeb(
                NativeBridgeEnvelope(type: "rewarded_result", payload: ["status": .string("failed"), "reason": .string("Rewarded ad is not ready")])
            )
            Task { await loadRewarded() }
            return
        }

        if let userId {
            let options = ServerSideVerificationOptions()
            options.userIdentifier = userId
            rewarded.serverSideVerificationOptions = options
        }

        rewardedEarned = false
        rewardedCompletion = { envelope in
            bridgeHub.sendToWeb(envelope)
        }

        rewarded.present(from: viewController) { [weak self] in
            self?.rewardedEarned = true
        }
    }

    private func loadInterstitial() async {
        guard canServeAds else { return }
        do {
            interstitial = try await InterstitialAd.load(with: AppConfig.AdUnit.interstitial, request: Request())
            interstitial?.fullScreenContentDelegate = self
        } catch {
            print("Failed to load interstitial: \(error.localizedDescription)")
        }
    }

    private func loadRewarded() async {
        guard canServeAds else { return }
        do {
            rewarded = try await RewardedAd.load(with: AppConfig.AdUnit.rewarded, request: Request())
            rewarded?.fullScreenContentDelegate = self
        } catch {
            print("Failed to load rewarded: \(error.localizedDescription)")
        }
    }
}

extension AdManager: FullScreenContentDelegate {
    func adDidDismissFullScreenContent(_ ad: FullScreenPresentingAd) {
        if (ad as AnyObject) === interstitial {
            interstitialCompletion?()
            interstitialCompletion = nil
            return
        }

        if (ad as AnyObject) === rewarded {
            let status = rewardedEarned ? "granted" : "closed"
            rewardedCompletion?(
                NativeBridgeEnvelope(type: "rewarded_result", payload: ["status": .string(status)])
            )
            rewardedCompletion = nil
            rewardedEarned = false
            Task { await loadRewarded() }
            return
        }
    }

    func ad(_ ad: FullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        if (ad as AnyObject) === rewarded {
            rewardedCompletion?(
                NativeBridgeEnvelope(type: "rewarded_result", payload: [
                    "status": .string("failed"),
                    "reason": .string(error.localizedDescription),
                ])
            )
            rewardedCompletion = nil
            rewardedEarned = false
            Task { await loadRewarded() }
        }

        if (ad as AnyObject) === interstitial {
            Task { await loadInterstitial() }
        }
    }
}
