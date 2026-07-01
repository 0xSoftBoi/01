import { Router } from "express";
import { keySet } from "./keys.js";

export const jwksRouter = Router();

// The public half of the signing key, in the standard JWKS shape. This is
// the ONE thing that crosses the trust boundary in both directions: this
// server publishes it, and Canton's participant (or any other relying party)
// fetches it to verify token signatures — never the private key itself.
jwksRouter.get("/.well-known/jwks.json", async (_req, res) => {
  const { publicJwk } = await keySet();
  res.json({ keys: [publicJwk] });
});
