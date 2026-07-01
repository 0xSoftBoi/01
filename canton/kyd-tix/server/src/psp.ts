import { createHmac, timingSafeEqual } from "node:crypto";
import { Cash } from "@kyd/kyd-tix-0.1.0/lib/Kyd/Cash";
import type { MintableLedger } from "./ledgerSession.js";

// Real PSPs (Stripe, Adyen, ...) sign each webhook body with a secret shared
// only with the merchant; the merchant recomputes the HMAC over the exact
// bytes received and rejects anything that doesn't match before acting on
// it. That's what makes "the webhook says the charge cleared" trustworthy
// without the browser — or anyone else — ever holding operator authority
// (AUDIT.md production gap #4: the demo previously minted from a
// browser-held operator token directly).
const WEBHOOK_SECRET = process.env.PSP_WEBHOOK_SECRET ?? "demo-webhook-secret-do-not-use-in-production";
if (!process.env.PSP_WEBHOOK_SECRET) {
  // eslint-disable-next-line no-console
  console.warn(
    "[psp] PSP_WEBHOOK_SECRET is not set — falling back to a well-known demo " +
      "secret. Anyone who knows this string can forge a charge.succeeded event " +
      "and mint Cash. Set PSP_WEBHOOK_SECRET before deploying this outside a demo.",
  );
}

export function signPspEvent(rawBody: string): string {
  return "sha256=" + createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

export function verifyPspSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!signatureHeader?.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  } catch {
    return false;
  }
  // Constant-time compare, and only ever on equal-length buffers — a length
  // mismatch already means "not equal" without leaking timing on the digest.
  return provided.length === expected.length && timingSafeEqual(expected, provided);
}

export interface PspResult {
  status: number;
  body: Record<string, unknown>;
}

// The narrow persistence surface the idempotency check needs (db.ts's KydDb
// satisfies it) — an interface so callers/tests without a db can still run
// the signature/mint path, same pattern as MintableLedger.
export interface DeliveryStore {
  seenWebhookDelivery(deliveryId: string): boolean;
  recordWebhookDelivery(deliveryId: string): void;
}

interface ChargeSucceededEvent {
  id?: string;
  type?: string;
  data?: { fanParty?: string; amount?: number };
}

// Real PSPs retry a webhook until they see a 2xx, so the same charge WILL
// arrive more than once; without dedup, every network blip near our response
// mints a second Cash for the same payment. The PSP's own event id is the
// dedup key when present; otherwise the HMAC over the exact bytes stands in
// (same signed bytes = same delivery — a legitimately distinct charge always
// differs somewhere in the body).
function deliveryIdFor(event: ChargeSucceededEvent, rawBody: Buffer): string {
  if (typeof event.id === "string" && event.id.length > 0) return event.id;
  return "sha256:" + createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
}

// The one code path that ever mints app-balance Cash. Both the real webhook
// route (webhook.ts, an untrusted HTTP request from the internet) and the
// fan-facing on-ramp (payments.ts, which simulates the PSP round trip
// in-process since this demo has no real card processor) call exactly this
// function — there is no second, weaker route to a mint.
export async function processPspWebhook(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  session: MintableLedger,
  operatorParty: string,
  deliveries?: DeliveryStore,
): Promise<PspResult> {
  if (!verifyPspSignature(rawBody, signatureHeader)) {
    return { status: 401, body: { error: "invalid webhook signature" } };
  }
  let event: ChargeSucceededEvent;
  try {
    event = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return { status: 400, body: { error: "malformed payload" } };
  }
  if (event.type !== "charge.succeeded") {
    return { status: 202, body: { ignored: true } };
  }
  // Checked before the mint, recorded only AFTER it succeeds: a mint that
  // failed mid-flight stays retryable, while a mint that succeeded can never
  // run twice. 200 (not an error) on replay — the PSP just needs to know it
  // can stop retrying.
  const deliveryId = deliveryIdFor(event, rawBody);
  if (deliveries?.seenWebhookDelivery(deliveryId)) {
    return { status: 200, body: { status: "duplicate" } };
  }
  const { fanParty, amount } = event.data ?? {};
  if (typeof fanParty !== "string" || typeof amount !== "number" || !Number.isFinite(amount) || !(amount > 0)) {
    return { status: 400, body: { error: "malformed charge event" } };
  }
  await session.create(Cash, {
    operator: operatorParty,
    owner: fanParty,
    amount: amount.toFixed(10),
    lock: null,
    lockRecipient: null,
    lockCoSigner: null,
    observers: [],
  });
  deliveries?.recordWebhookDelivery(deliveryId);
  return { status: 200, body: { minted: true } };
}
