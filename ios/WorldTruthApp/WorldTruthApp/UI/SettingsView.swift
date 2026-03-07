import SwiftUI
import StoreKit

struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject private var purchaseManager: PurchaseManager

    private var versionString: String {
        Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "1.0"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                LinearGradient(
                    colors: [
                        Color(red: 0.96, green: 0.95, blue: 1.0),
                        Color(red: 0.98, green: 0.97, blue: 0.94),
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                ScrollView {
                    VStack(alignment: .leading, spacing: 18) {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Settings")
                                .font(.system(size: 30, weight: .bold, design: .rounded))
                            Text("Purchases, support, and app details in one place.")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.top, 8)

                        SettingsCard(title: "Monetization", icon: "sparkles.rectangle.stack.fill") {
                            if purchaseManager.hasNoAds {
                                HStack(spacing: 12) {
                                    Image(systemName: "checkmark.seal.fill")
                                        .foregroundStyle(.green)
                                        .font(.title3)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("No-Ads is active")
                                            .font(.headline)
                                        Text("Banner and interstitial ads are disabled on this device.")
                                            .font(.footnote)
                                            .foregroundStyle(.secondary)
                                    }
                                }
                                .padding(14)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .background(Color.green.opacity(0.09))
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            } else {
                                Button {
                                    Task { await purchaseManager.purchaseNoAds() }
                                } label: {
                                    HStack {
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text("Remove Ads")
                                                .font(.headline)
                                                .foregroundStyle(.primary)
                                            Text("One-time purchase")
                                                .font(.footnote)
                                                .foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Text(purchaseManager.noAdsProduct?.displayPrice ?? "$2.99")
                                            .font(.headline)
                                            .foregroundStyle(Color(red: 0.32, green: 0.26, blue: 0.84))
                                    }
                                    .padding(14)
                                    .frame(maxWidth: .infinity)
                                    .background(Color.white)
                                    .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                                }
                                .buttonStyle(.plain)

                                Button("Restore Purchases") {
                                    Task { await purchaseManager.restorePurchases() }
                                }
                                .font(.headline)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 14)
                                .background(Color(red: 0.94, green: 0.92, blue: 1.0))
                                .foregroundStyle(Color(red: 0.32, green: 0.26, blue: 0.84))
                                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                            }

                            if let error = purchaseManager.lastError {
                                Text(error)
                                    .font(.footnote)
                                    .foregroundStyle(.red)
                                    .padding(12)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.red.opacity(0.08))
                                    .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                            }
                        }

                        SettingsCard(title: "Links", icon: "safari.fill") {
                            SettingsLinkRow(
                                title: "Privacy Policy",
                                subtitle: "Read how data and purchases are handled.",
                                destination: URL(string: "https://theworldtruth.com/privacy")!
                            )
                            SettingsLinkRow(
                                title: "Support",
                                subtitle: "Contact support by email.",
                                destination: URL(string: "mailto:support@theworldtruth.com")!
                            )
                        }

                        SettingsCard(title: "Version", icon: "info.circle.fill") {
                            HStack {
                                Text("App Version")
                                    .font(.headline)
                                Spacer()
                                Text(versionString)
                                    .font(.headline)
                                    .foregroundStyle(.secondary)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity)
                            .background(Color.white.opacity(0.82))
                            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 28)
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        dismiss()
                    } label: {
                        Text("Done")
                            .font(.headline)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Color.white.opacity(0.85))
                            .clipShape(Capsule())
                    }
                }
            }
        }
    }
}

private struct SettingsCard<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .foregroundStyle(Color(red: 0.32, green: 0.26, blue: 0.84))
                Text(title)
                    .font(.headline)
            }

            content
        }
        .padding(18)
        .background(Color.white.opacity(0.74))
        .clipShape(RoundedRectangle(cornerRadius: 24, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .stroke(Color.white.opacity(0.7), lineWidth: 1)
        )
        .shadow(color: Color.black.opacity(0.06), radius: 18, x: 0, y: 12)
    }
}

private struct SettingsLinkRow: View {
    let title: String
    let subtitle: String
    let destination: URL

    var body: some View {
        Link(destination: destination) {
            HStack(spacing: 14) {
                VStack(alignment: .leading, spacing: 3) {
                    Text(title)
                        .font(.headline)
                        .foregroundStyle(.primary)
                    Text(subtitle)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }

                Spacer()

                Image(systemName: "arrow.up.right")
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(Color(red: 0.32, green: 0.26, blue: 0.84))
            }
            .padding(14)
            .frame(maxWidth: .infinity)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        }
        .buttonStyle(.plain)
    }
}
