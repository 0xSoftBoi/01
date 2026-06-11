// Minimal JSON API client: query / create / exercise with sandbox JWTs.
// Same architecture as the web app: the CATALOG reads via the operator party
// (KYD's backend role); every ACTION is signed by the fan's own party.
// Production swaps `token(for:)` for your OAuth2/OIDC provider's JWT.
import Foundation

enum LedgerError: Error {
    case http(Int, String)
    case insufficientFunds
}

struct LedgerClient {
    /// Host running run-local.sh. Simulator: localhost. Physical device: your
    /// Mac's LAN IP (and the dev ATS exception in project.yml).
    static var host = "localhost"

    static var apiBase: URL { URL(string: "http://\(host):7575/v1")! }
    /// demo-parties.json is served by the Vite dev server.
    static var bootstrapURL: URL { URL(string: "http://\(host):5173/demo-parties.json")! }

    /// Package id of kyd-tix, read from the generated bindings; paste from
    /// `cat app/daml.js/kyd-tix-0.1.0/package.json` ("name" suffix) or
    /// `daml damlc inspect-dar` if you rebuild the DAR.
    static var packageId = "PASTE_KYD_TIX_PACKAGE_ID"

    let party: String

    // Unsigned sandbox JWT (the local ledger does not verify signatures).
    private var token: String {
        func b64url(_ s: String) -> String {
            Data(s.utf8).base64EncodedString()
                .replacingOccurrences(of: "+", with: "-")
                .replacingOccurrences(of: "/", with: "_")
                .replacingOccurrences(of: "=", with: "")
        }
        let header = b64url(#"{"alg":"HS256","typ":"JWT"}"#)
        let payload = b64url(
            #"{"https://daml.com/ledger-api":{"ledgerId":"sandbox","applicationId":"kyd-fan-ios","actAs":["\#(party)"],"readAs":[]}}"#)
        return "\(header).\(payload).kyd"
    }

    private func post(_ path: String, body: [String: Any]) async throws -> Data {
        var req = URLRequest(url: Self.apiBase.appendingPathComponent(path))
        req.httpMethod = "POST"
        req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, resp) = try await URLSession.shared.data(for: req)
        let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
        guard status == 200 else {
            throw LedgerError.http(status, String(data: data, encoding: .utf8) ?? "")
        }
        return data
    }

    func query<T: Codable>(_ module: String, _ entity: String, as type: T.Type) async throws -> [Contract<T>] {
        let data = try await post("query", body: [
            "templateIds": ["\(Self.packageId):\(module):\(entity)"]
        ])
        return try JSONDecoder().decode(QueryResponse<T>.self, from: data).result
    }

    func create(_ module: String, _ entity: String, payload: [String: Any]) async throws {
        _ = try await post("create", body: [
            "templateId": "\(Self.packageId):\(module):\(entity)",
            "payload": payload,
        ])
    }

    /// Returns the raw exerciseResult JSON value.
    func exercise(_ module: String, _ entity: String, contractId: String,
                  choice: String, argument: [String: Any]) async throws -> Any {
        let data = try await post("exercise", body: [
            "templateId": "\(Self.packageId):\(module):\(entity)",
            "contractId": contractId,
            "choice": choice,
            "argument": argument,
        ])
        let obj = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let result = obj?["result"] as? [String: Any]
        return result?["exerciseResult"] ?? [:]
    }

    // Wallet plumbing the fan never sees: find or carve an exact-amount note.
    func exactNote(amount: Double) async throws -> String {
        let notes = try await query("Kyd.Cash", "Cash", as: CashPayload.self)
            .filter { $0.payload.owner == party }
            .sorted { Double($0.payload.amount) ?? 0 < Double($1.payload.amount) ?? 0 }
        if let exact = notes.first(where: { Double($0.payload.amount) == amount }) {
            return exact.contractId
        }
        guard let big = notes.first(where: { (Double($0.payload.amount) ?? 0) > amount }) else {
            throw LedgerError.insufficientFunds
        }
        let result = try await exercise("Kyd.Cash", "Cash", contractId: big.contractId,
                                        choice: "Cash_Split",
                                        argument: ["splitAmount": String(format: "%.10f", amount)])
        guard let pair = result as? [String: Any], let slice = pair["_2"] as? String else {
            throw LedgerError.http(0, "unexpected Cash_Split result")
        }
        return slice
    }
}
