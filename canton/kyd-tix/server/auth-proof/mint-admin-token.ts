// One-off: prints a wildcard-authority token to stdout, signed with the key
// at SIGNING_KEY_PATH (persisting/generating it if this is the first call).
// Used only to seed the ledger (party allocation + DAR upload) before any
// real party — and therefore any normal, party-scoped token — can exist.
// Deliberately not part of the server's HTTP surface; see tokens.ts.
import { issueAdminToken } from "../src/tokens.js";

const token = await issueAdminToken(10 * 60);
process.stdout.write(token);
