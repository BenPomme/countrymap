import SwiftUI
import UIKit

@main
struct WorldTruthApp: App {
    @StateObject private var purchaseManager = PurchaseManager()
    @StateObject private var adManager = AdManager()

    init() {
        configureAppearance()
    }

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

    private func configureAppearance() {
        let shellTint = UIColor(red: 0.32, green: 0.26, blue: 0.84, alpha: 1.0)
        let shellBackground = UIColor(red: 0.99, green: 0.985, blue: 0.995, alpha: 1.0)

        let navAppearance = UINavigationBarAppearance()
        navAppearance.configureWithOpaqueBackground()
        navAppearance.backgroundColor = shellBackground
        navAppearance.shadowColor = UIColor.black.withAlphaComponent(0.06)
        navAppearance.titleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 17, weight: .semibold),
        ]

        UINavigationBar.appearance().standardAppearance = navAppearance
        UINavigationBar.appearance().scrollEdgeAppearance = navAppearance
        UINavigationBar.appearance().compactAppearance = navAppearance
        UINavigationBar.appearance().tintColor = shellTint

        let tabAppearance = UITabBarAppearance()
        tabAppearance.configureWithOpaqueBackground()
        tabAppearance.backgroundColor = shellBackground
        tabAppearance.shadowColor = UIColor.black.withAlphaComponent(0.08)
        tabAppearance.stackedLayoutAppearance.selected.iconColor = shellTint
        tabAppearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: shellTint,
        ]
        tabAppearance.stackedLayoutAppearance.normal.iconColor = UIColor.secondaryLabel
        tabAppearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.secondaryLabel,
        ]

        UITabBar.appearance().standardAppearance = tabAppearance
        UITabBar.appearance().scrollEdgeAppearance = tabAppearance
        UITabBar.appearance().tintColor = shellTint
    }
}
