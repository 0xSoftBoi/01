import SwiftUI

struct ContentView: View {
    @State private var parties: DemoParties?
    @State private var fanParty: String = ""
    @State private var bootError = false
    @State private var jumpToPasses = false

    var body: some View {
        if let parties, !fanParty.isEmpty {
            let fan = LedgerClient(party: fanParty)
            let catalog = LedgerClient(party: parties.operatorParty)
            TabView(selection: $jumpToPasses) {
                NavigationStack {
                    DiscoverView(catalog: catalog, fan: fan, parties: parties) {
                        jumpToPasses = true
                    }
                    .navigationTitle("Discover")
                    .toolbar { identityMenu(parties) }
                }
                .tabItem { Label("Discover", systemImage: "sparkles") }
                .tag(false)

                NavigationStack {
                    PassesView(catalog: catalog, fan: fan)
                        .navigationTitle("My Tickets")
                }
                .tabItem { Label("Tickets", systemImage: "ticket") }
                .tag(true)

                NavigationStack {
                    WalletView(fan: fan, parties: parties)
                        .navigationTitle("Wallet")
                }
                .tabItem { Label("Wallet", systemImage: "creditcard") }
            }
        } else {
            VStack(spacing: 12) {
                Image(systemName: "arrow.down.to.line")
                    .font(.system(size: 22, weight: .black))
                Text("kyd labs").font(.system(size: 44, weight: .black))
                if bootError {
                    Text("Can't reach the demo stack.").font(.headline)
                    Text("Run integration/run-local.sh and `npm run dev` in app/, set LedgerClient.host to your Mac's LAN IP for a physical device, then relaunch.")
                        .font(.footnote).foregroundColor(.secondary)
                        .multilineTextAlignment(.center).padding(.horizontal, 40)
                    Button("Retry") { Task { await boot() } }
                } else {
                    ProgressView()
                }
            }
            .task { await boot() }
        }
    }

    private func identityMenu(_ parties: DemoParties) -> some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Menu {
                Button("Alice") { fanParty = parties.alice }
                Button("Bob") { fanParty = parties.bob }
            } label: {
                Image(systemName: "person.crop.circle")
            }
        }
    }

    private func boot() async {
        do {
            let (data, _) = try await URLSession.shared.data(from: LedgerClient.bootstrapURL)
            let p = try JSONDecoder().decode(DemoParties.self, from: data)
            parties = p
            fanParty = p.alice
            bootError = false
        } catch {
            bootError = true
        }
    }
}
