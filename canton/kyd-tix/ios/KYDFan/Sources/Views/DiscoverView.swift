import SwiftUI

struct DiscoverView: View {
    let catalog: LedgerClient   // operator-read catalog service
    let fan: LedgerClient       // the signed-in fan
    let parties: DemoParties
    let onPurchased: () -> Void

    @State private var events: [Contract<EventPayload>] = []
    @State private var allocations: [Contract<AllocationPayload>] = []
    @State private var busy = false
    @State private var error: String?

    var body: some View {
        List {
            if let error { Text(error).foregroundColor(.red).font(.footnote) }
            ForEach(events, id: \.contractId) { ev in
                Section(header: header(ev.payload)) {
                    let levels = allocations
                        .map(\.payload)
                        .filter { $0.eventId == ev.payload.eventId && Int($0.sold) ?? 0 < Int($0.size) ?? 0 }
                        .sorted { Double($0.price) ?? 0 < Double($1.price) ?? 0 }
                    if levels.isEmpty {
                        Text("Sold out — watch for resale offers.")
                            .font(.footnote).foregroundColor(.secondary)
                    }
                    ForEach(levels, id: \.serialBase) { level in
                        levelRow(ev.payload, level)
                    }
                }
            }
        }
        .refreshable { await load() }
        .task {
            await load()
            // light polling so fills/sell-outs appear live
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 2_000_000_000)
                await load()
            }
        }
    }

    private func header(_ ev: EventPayload) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(ev.name).font(.headline).textCase(nil)
            Text(ev.eventTime.prefix(10)).font(.caption).foregroundColor(.secondary)
        }
    }

    private func levelRow(_ ev: EventPayload, _ level: AllocationPayload) -> some View {
        let left = (Int(level.size) ?? 0) - (Int(level.sold) ?? 0)
        let price = Double(level.price) ?? 0
        return HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("\(level.tierId)  $\(price, specifier: "%.2f")").font(.body.weight(.bold))
                Text("\(left) left at this price").font(.caption).foregroundColor(.secondary)
            }
            Spacer()
            Button(busy ? "…" : "Buy") {
                Task { await buy(ev: ev, level: level, price: price) }
            }
            .buttonStyle(.borderedProminent)
            .disabled(busy)
        }
    }

    private func load() async {
        do {
            events = try await catalog.query("Kyd.Event", "Event", as: EventPayload.self)
            allocations = try await catalog.query("Kyd.Event", "TierAllocation", as: AllocationPayload.self)
            error = nil
        } catch {
            self.error = "Can't reach the stack — is run-local.sh up?"
        }
    }

    private func buy(ev: EventPayload, level: AllocationPayload, price: Double) async {
        busy = true
        defer { busy = false }
        do {
            let cashCid = try await fan.exactNote(amount: price)
            try await fan.create("Kyd.Event", "PurchaseOrder", payload: [
                "operator": parties.operatorParty,
                "venue": parties.venue,
                "fan": fan.party,
                "eventId": ev.eventId,
                "tierId": level.tierId,
                "cashCid": cashCid,
            ])
            onPurchased()
        } catch LedgerError.insufficientFunds {
            error = "Not enough balance — add funds in Wallet."
        } catch {
            self.error = "Purchase failed — please try again."
        }
    }
}
