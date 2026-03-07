import Foundation
import StoreKit

@MainActor
final class PurchaseManager: ObservableObject {
    @Published private(set) var noAdsProduct: Product?
    @Published private(set) var hasNoAds = false
    @Published private(set) var isLoading = false
    @Published var lastError: String?

    private var updatesTask: Task<Void, Never>?

    init() {
        updatesTask = observeTransactionUpdates()
    }

    deinit {
        updatesTask?.cancel()
    }

    func bootstrap() async {
        await loadProducts()
        await refreshEntitlements()
    }

    func loadProducts() async {
        isLoading = true
        defer { isLoading = false }

        do {
            let products = try await Product.products(for: [AppConfig.noAdsProductID])
            noAdsProduct = products.first
        } catch {
            lastError = "Unable to load products: \(error.localizedDescription)"
        }
    }

    func refreshEntitlements() async {
        var hasEntitlement = false

        for await result in Transaction.currentEntitlements {
            guard case let .verified(transaction) = result else { continue }
            if transaction.productID == AppConfig.noAdsProductID, transaction.revocationDate == nil {
                hasEntitlement = true
            }
        }

        hasNoAds = hasEntitlement
    }

    func purchaseNoAds() async {
        guard let product = noAdsProduct else {
            lastError = "No-ads product is unavailable"
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verificationResult):
                guard case let .verified(transaction) = verificationResult else {
                    lastError = "Transaction verification failed"
                    return
                }

                await transaction.finish()
                await refreshEntitlements()
            case .userCancelled:
                break
            case .pending:
                lastError = "Purchase is pending approval"
            @unknown default:
                lastError = "Unknown purchase result"
            }
        } catch {
            lastError = "Purchase failed: \(error.localizedDescription)"
        }
    }

    func restorePurchases() async {
        isLoading = true
        defer { isLoading = false }

        do {
            try await AppStore.sync()
            await refreshEntitlements()
        } catch {
            lastError = "Restore failed: \(error.localizedDescription)"
        }
    }

    private func observeTransactionUpdates() -> Task<Void, Never> {
        Task.detached { [weak self] in
            guard let self else { return }
            for await update in Transaction.updates {
                guard case let .verified(transaction) = update else { continue }
                await transaction.finish()
                await MainActor.run {
                    Task { await self.refreshEntitlements() }
                }
            }
        }
    }
}
