import SwiftUI

struct WalletView: View {
    let fan: LedgerClient
    let parties: DemoParties

    @State private var balance: Double = 0
    @State private var busy = false

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 4) {
                Text("Available balance").font(.footnote).foregroundColor(.secondary)
                Text("$\(balance, specifier: "%.2f")")
                    .font(.system(size: 44, weight: .black, design: .rounded))
            }
            .padding(.top, 40)

            HStack(spacing: 12) {
                ForEach([25, 50, 100], id: \.self) { amount in
                    Button("+$\(amount)") { Task { await topUp(Double(amount)) } }
                        .buttonStyle(.borderedProminent)
                        .disabled(busy)
                }
            }
            Text("Demo on-ramp: in production your card clears with the payment provider and the balance is minted server-side — same one-tap feel, real money.")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            Spacer()
        }
        .task {
            await load()
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_500_000_000)
                await load()
            }
        }
    }

    private func load() async {
        if let notes = try? await fan.query("Kyd.Cash", "Cash", as: CashPayload.self) {
            balance = notes
                .filter { $0.payload.owner == fan.party }
                .reduce(0) { $0 + (Double($1.payload.amount) ?? 0) }
        }
    }

    // Simulated PSP on-ramp: the operator mints the app balance (server-side
    // webhook in production).
    private func topUp(_ amount: Double) async {
        busy = true
        defer { busy = false }
        let operatorClient = LedgerClient(party: parties.operatorParty)
        try? await operatorClient.create("Kyd.Cash", "Cash", payload: [
            "operator": parties.operatorParty,
            "owner": fan.party,
            "amount": String(format: "%.10f", amount),
            "observers": [],
        ])
        await load()
    }
}
