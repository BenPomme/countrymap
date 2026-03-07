import Foundation

final class InterstitialCapStore {
    private let defaults: UserDefaults
    private let cap: Int

    init(defaults: UserDefaults = .standard, cap: Int = 3) {
        self.defaults = defaults
        self.cap = cap
    }

    func canShowNow() -> Bool {
        return currentCount() < cap
    }

    @discardableResult
    func recordDisplay() -> Int {
        let key = storageKey()
        let count = defaults.integer(forKey: key) + 1
        defaults.set(count, forKey: key)
        return count
    }

    private func currentCount() -> Int {
        return defaults.integer(forKey: storageKey())
    }

    private func storageKey() -> String {
        return "interstitial_cap_\(utcDateKey())"
    }

    private func utcDateKey(date: Date = Date()) -> String {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .gmt
        let parts = calendar.dateComponents([.year, .month, .day], from: date)
        return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
    }
}
