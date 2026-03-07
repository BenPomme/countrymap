import SwiftUI

@main
struct WorldTruthApp: App {
    @StateObject private var purchaseManager = PurchaseManager()
    @StateObject private var adManager = AdManager()

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .environmentObject(purchaseManager)
                .environmentObject(adManager)
                .task {
                    await purchaseManager.bootstrap()
                    adManager.bootstrap(adsDisabled: purchaseManager.hasNoAds)
                }
        }
    }
}
