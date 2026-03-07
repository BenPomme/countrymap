import SwiftUI

struct MainTabView: View {
    @State private var selectedRoute: WorldTruthRoute = .map
    @State private var showSettings = false

    var body: some View {
        NavigationStack {
            TabView(selection: $selectedRoute) {
                ForEach(WorldTruthRoute.allCases) { route in
                    WorldTruthWebScreen(route: route)
                        .tabItem {
                            Label(route.title, systemImage: route.systemImage)
                        }
                        .tag(route)
                }
            }
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(Color(red: 0.32, green: 0.26, blue: 0.84))
                            .frame(width: 34, height: 34)
                            .background(
                                Circle()
                                    .fill(Color(red: 0.95, green: 0.93, blue: 1.0))
                            )
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
                    .presentationDetents([.medium, .large])
                    .presentationDragIndicator(.visible)
            }
            .navigationTitle(selectedRoute.title)
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar, .tabBar)
            .toolbarBackground(Color(.systemBackground), for: .navigationBar, .tabBar)
            .tint(Color(red: 0.32, green: 0.26, blue: 0.84))
        }
    }
}
