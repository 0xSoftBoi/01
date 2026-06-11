import SwiftUI
import CoreImage.CIFilterBuiltins

struct PassesView: View {
    let catalog: LedgerClient
    let fan: LedgerClient

    @State private var tickets: [Contract<TicketPayload>] = []
    @State private var pending: [Contract<PurchaseOrderPayload>] = []
    @State private var eventNames: [String: String] = [:]

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                if tickets.isEmpty && pending.isEmpty {
                    VStack(spacing: 6) {
                        Text("No passes yet").font(.headline)
                        Text("Grab a ticket under Discover — it lands here in seconds.")
                            .font(.footnote).foregroundColor(.secondary)
                    }
                    .padding(.top, 80)
                }
                ForEach(pending, id: \.contractId) { order in
                    pendingCard(order.payload)
                }
                ForEach(tickets, id: \.contractId) { ticket in
                    passCard(ticket)
                }
            }
            .padding()
        }
        .task {
            await load()
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 1_000_000_000)
                await load()
            }
        }
    }

    private func pendingCard(_ order: PurchaseOrderPayload) -> some View {
        VStack(spacing: 10) {
            Text(eventNames[order.eventId] ?? order.eventId).font(.headline)
            ProgressView()
            Text("Issuing your \(order.tierId) pass…")
                .font(.footnote).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(24)
        .background(RoundedRectangle(cornerRadius: 20).strokeBorder(style: StrokeStyle(lineWidth: 1, dash: [6])))
    }

    private func passCard(_ ticket: Contract<TicketPayload>) -> some View {
        let p = ticket.payload
        return VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text(eventNames[p.eventId] ?? p.eventId).font(.headline)
                    Text("\(p.tierId) · #\(p.serial)").font(.caption).foregroundColor(.secondary)
                }
                Spacer()
                if p.redeemed {
                    Text("USED").font(.caption2.weight(.heavy)).foregroundColor(.secondary)
                }
            }
            qrImage(ticket.contractId)
                .interpolation(.none)
                .resizable()
                .scaledToFit()
                .frame(width: 160, height: 160)
                .padding(10)
                .background(Color.white)
                .cornerRadius(12)
                .opacity(p.redeemed ? 0.35 : 1)
            Text("Paid $\(Double(p.facePrice) ?? 0, specifier: "%.2f") · resale cap $\(Double(p.maxResalePrice) ?? 0, specifier: "%.2f")")
                .font(.caption).foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(18)
        .background(RoundedRectangle(cornerRadius: 20).fill(Color(.secondarySystemBackground)))
    }

    private func qrImage(_ value: String) -> Image {
        let filter = CIFilter.qrCodeGenerator()
        filter.message = Data(value.utf8)
        let context = CIContext()
        if let output = filter.outputImage,
           let cgImage = context.createCGImage(output, from: output.extent) {
            return Image(decorative: cgImage, scale: 1)
        }
        return Image(systemName: "qrcode")
    }

    private func load() async {
        if let t = try? await fan.query("Kyd.Ticket", "Ticket", as: TicketPayload.self) {
            tickets = t.filter { $0.payload.owner == fan.party }
        }
        if let o = try? await fan.query("Kyd.Event", "PurchaseOrder", as: PurchaseOrderPayload.self) {
            pending = o.filter { $0.payload.fan == fan.party }
        }
        if let evs = try? await catalog.query("Kyd.Event", "Event", as: EventPayload.self) {
            eventNames = Dictionary(uniqueKeysWithValues: evs.map { ($0.payload.eventId, $0.payload.name) })
        }
    }
}
