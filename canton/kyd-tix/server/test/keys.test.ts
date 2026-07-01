import { describe, expect, it, vi, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// keySet() caches at module scope. vi.resetModules() + a fresh dynamic
// import gets a genuinely separate module instance with its own cache —
// standing in for two separate OS processes (what SIGNING_KEY_PATH is
// actually for: server/auth-proof/'s admin-token script and the long-running
// server are different processes and must still agree on one key).
async function freshKeySet(keyPath: string) {
  vi.resetModules();
  process.env.SIGNING_KEY_PATH = keyPath;
  const mod = await import("../src/keys.js");
  return mod.keySet();
}

describe("SIGNING_KEY_PATH persistence", () => {
  let dir: string;

  afterEach(() => {
    delete process.env.SIGNING_KEY_PATH;
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it("a second module instance loading the same persisted key derives the identical kid and modulus", async () => {
    dir = mkdtempSync(join(tmpdir(), "kyd-signing-key-"));
    const keyPath = join(dir, "signing-key.pem");

    const first = await freshKeySet(keyPath);
    const second = await freshKeySet(keyPath);

    expect(second.publicJwk.n).toBe(first.publicJwk.n); // same key material
    expect(second.kid).toBe(first.kid); // thumbprint derived from the key, not random
  });

  it("two module instances without a shared path get genuinely different keys", async () => {
    const dirA = mkdtempSync(join(tmpdir(), "kyd-signing-key-"));
    const dirB = mkdtempSync(join(tmpdir(), "kyd-signing-key-"));
    try {
      const a = await freshKeySet(join(dirA, "does-not-exist.pem"));
      // Don't persist for b: leave SIGNING_KEY_PATH unset entirely.
      delete process.env.SIGNING_KEY_PATH;
      vi.resetModules();
      const bMod = await import("../src/keys.js");
      const b = await bMod.keySet();
      expect(a.publicJwk.n).not.toBe(b.publicJwk.n);
    } finally {
      rmSync(dirA, { recursive: true, force: true });
      rmSync(dirB, { recursive: true, force: true });
    }
  });
});
