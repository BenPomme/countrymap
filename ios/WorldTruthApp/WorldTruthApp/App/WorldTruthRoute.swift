import Foundation

enum WorldTruthRoute: String, CaseIterable, Identifiable {
    case map = "/"
    case charts = "/charts"
    case discoveries = "/discoveries"
    case quiz = "/quiz"
    case truthle = "/truthle"
    case shop = "/truthle/shop"

    var id: String { rawValue }

    var title: String {
        switch self {
        case .map:
            return "Map"
        case .charts:
            return "Charts"
        case .discoveries:
            return "Discoveries"
        case .quiz:
            return "Quiz"
        case .truthle:
            return "Truthle"
        case .shop:
            return "Shop"
        }
    }

    var systemImage: String {
        switch self {
        case .map:
            return "globe.europe.africa"
        case .charts:
            return "chart.bar.xaxis"
        case .discoveries:
            return "sparkles"
        case .quiz:
            return "questionmark.circle"
        case .truthle:
            return "calendar"
        case .shop:
            return "bag"
        }
    }

    var allowsBannerAds: Bool {
        switch self {
        case .map, .shop:
            return true
        case .charts, .discoveries, .quiz, .truthle:
            return false
        }
    }

    var url: URL {
        var components = URLComponents(url: AppConfig.baseWebURL, resolvingAgainstBaseURL: false)
        components?.path = self == .map ? "/" : rawValue
        components?.queryItems = AppConfig.embeddedQueryItems
        return components?.url ?? AppConfig.baseWebURL
    }
}
