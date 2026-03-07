import SwiftUI
import GoogleMobileAds

struct BannerAdContainer: UIViewRepresentable {
    func makeUIView(context: Context) -> BannerView {
        let banner = BannerView(adSize: AdSizeBanner)
        banner.adUnitID = AppConfig.AdUnit.banner
        banner.rootViewController = UIApplication.shared.topMostViewController()
        banner.load(Request())
        return banner
    }

    func updateUIView(_ uiView: BannerView, context: Context) {
        uiView.rootViewController = UIApplication.shared.topMostViewController()
    }
}
