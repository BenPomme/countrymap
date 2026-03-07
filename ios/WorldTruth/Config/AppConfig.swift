import Foundation

enum AppConfig {
    static let baseWebURL = URL(string: "https://theworldtruth.com")!
    static let embeddedQueryItems = [URLQueryItem(name: "embedded", value: "ios")]
    static let webBridgeHandlerName = "worldTruthBridge"
    static let iosUserAgentMarker = "WorldTruthIOS"

    static let noAdsProductID = "com.theworldtruth.noads.lifetime"

    enum AdUnit {
        // Replace with production IDs before release.
        static let appOpen = "ca-app-pub-3940256099942544/9257395921"
        static let banner = "ca-app-pub-3940256099942544/2435281174"
        static let interstitial = "ca-app-pub-3940256099942544/4411468910"
        static let rewarded = "ca-app-pub-3940256099942544/1712485313"
    }
}
