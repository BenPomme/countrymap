import SwiftUI

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var purchaseManager: PurchaseManager

    var body: some View {
        NavigationStack {
            List {
                Section("Monetization") {
                    if purchaseManager.hasNoAds {
                        Label("No-Ads is active", systemImage: "checkmark.seal.fill")
                            .foregroundStyle(.green)
                    } else {
                        Button {
                            Task { await purchaseManager.purchaseNoAds() }
                        } label: {
                            HStack {
                                Text("Remove Ads")
                                Spacer()
                                if let product = purchaseManager.noAdsProduct {
                                    Text(product.displayPrice)
                                        .foregroundStyle(.secondary)
                                }
                            }
                        }
                    }

                    Button("Restore Purchases") {
                        Task { await purchaseManager.restorePurchases() }
                    }
                }

                if let error = purchaseManager.lastError {
                    Section("Purchase Status") {
                        Text(error)
                            .foregroundStyle(.red)
                    }
                }

                Section("Links") {
                    Link("Privacy Policy", destination: URL(string: "https://theworldtruth.com/privacy")!)
                    Link("Support", destination: URL(string: "mailto:support@theworldtruth.com")!)
                }

                Section("Version") {
                    Text(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0")
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}
