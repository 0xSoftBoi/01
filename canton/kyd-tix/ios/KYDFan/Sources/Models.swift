// JSON API payloads. Daml Decimals/Ints arrive as strings; Party is a string.
import Foundation

struct DemoParties: Codable {
    let operatorParty: String
    let venue: String
    let artist: String
    let alice: String
    let bob: String

    enum CodingKeys: String, CodingKey {
        case operatorParty = "operator"
        case venue, artist, alice, bob
    }
}

struct Contract<T: Codable>: Codable {
    let contractId: String
    let payload: T
}

struct QueryResponse<T: Codable>: Codable {
    let result: [Contract<T>]
}

struct CreateResponse<T: Codable>: Codable {
    let result: Contract<T>
}

struct TierPayload: Codable {
    let tierId: String
    let basePrice: String
    let demandBps: String
    let supply: String
    let allocated: String
}

struct EventPayload: Codable {
    let eventId: String
    let name: String
    let eventTime: String
    let tiers: [TierPayload]
}

struct AllocationPayload: Codable {
    let eventId: String
    let tierId: String
    let price: String
    let serialBase: String
    let size: String
    let sold: String
}

struct TicketPayload: Codable {
    let owner: String
    let eventId: String
    let tierId: String
    let serial: String
    let facePrice: String
    let maxResalePrice: String
    let redeemed: Bool
}

struct CashPayload: Codable {
    let owner: String
    let amount: String
}

struct PurchaseOrderPayload: Codable {
    let operatorParty: String
    let venue: String
    let fan: String
    let eventId: String
    let tierId: String
    let cashCid: String

    enum CodingKeys: String, CodingKey {
        case operatorParty = "operator"
        case venue, fan, eventId, tierId, cashCid
    }
}
