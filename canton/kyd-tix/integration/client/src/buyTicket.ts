/**
 * Example KYD web-app flow against the HTTP JSON API: a fan places a purchase
 * order for a ticket, and the operator's auto-fill trigger settles it. This is
 * the same path `testPaidPrimarySaleRoutesRevenue` exercises in Daml Script,
 * but driven over HTTP with the daml2js-generated, fully-typed bindings.
 *
 * Run the stack first: `../run-local.sh` (sandbox + JSON API + triggers),
 * then `npm run codegen && npm install && npm start`.
 */
import Ledger, { CreateEvent } from "@daml/ledger";
import { Cash } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Cash";
import { PurchaseOrder } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Event";
import { Ticket } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Ticket";

const httpBaseUrl = process.env.KYD_JSON_API ?? "http://localhost:7575";

// In production these JWTs come from your auth provider; for the local sandbox
// they are unsigned HMAC tokens scoped to a single acting party.
const fanToken = process.env.KYD_FAN_TOKEN!;
const operator = process.env.KYD_OPERATOR_PARTY!;
const venue = process.env.KYD_VENUE_PARTY!;
const fan = process.env.KYD_FAN_PARTY!;

async function main(): Promise<void> {
  const ledger = new Ledger({ token: fanToken, httpBaseUrl });

  // The fan's funds the box office can spend (created upstream by the operator
  // and disclosed to the fan; here we just look one up).
  const [cash] = await ledger.query(Cash, { owner: fan });
  if (!cash) throw new Error("fan has no cash to spend");

  // Place a signed order for one GA ticket to SHOW-001. The fan's signature on
  // PurchaseOrder authorises moving their cash; the operator's trigger fills it.
  const order: CreateEvent<PurchaseOrder> = await ledger.create(PurchaseOrder, {
    operator,
    venue,
    fan,
    eventId: "SHOW-001",
    tierId: "GA",
    cashCid: cash.contractId,
  });
  console.log(`order placed: ${order.contractId}`);

  // Wait for the auto-fill trigger to mint our ticket, then report it.
  const ticket = await waitForTicket(ledger, "SHOW-001");
  console.log(
    `ticket issued: serial #${ticket.payload.serial}, ` +
      `paid ${ticket.payload.facePrice}, resale cap ${ticket.payload.maxResalePrice}`,
  );
}

async function waitForTicket(
  ledger: Ledger,
  eventId: string,
): Promise<CreateEvent<Ticket>> {
  for (let i = 0; i < 30; i++) {
    const tickets = await ledger.query(Ticket, { owner: fan, eventId });
    if (tickets.length > 0) return tickets[0];
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("timed out waiting for the ticket to be issued");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
