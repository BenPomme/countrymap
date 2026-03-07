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
                        Image(systemName: "gearshape")
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .navigationTitle(selectedRoute.title)
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}
