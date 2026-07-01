import { describe, expect, it, vi } from "vitest";
import { provisionUser, userIdFor, type UserProvisioner } from "../src/userManagement.js";

describe("userIdFor", () => {
  it("derives a stable, Daml-user-id-valid identifier from a role key", () => {
    // Party ids contain `::`, which Daml user ids disallow — this must not
    // just echo the party string.
    expect(userIdFor("alice")).toBe("kyd-alice");
    expect(userIdFor("alice")).not.toMatch(/::/);
  });
});

function fakeProvisioner(createUser = vi.fn().mockResolvedValue(undefined)): UserProvisioner & {
  createUser: ReturnType<typeof vi.fn>;
  grantUserRights: ReturnType<typeof vi.fn>;
} {
  return { createUser, grantUserRights: vi.fn().mockResolvedValue([]) };
}

describe("provisionUser", () => {
  it("creates the user with CanActAs/CanReadAs rights when it doesn't exist yet", async () => {
    const provisioner = fakeProvisioner();
    await provisionUser(provisioner, "kyd-alice", "Alice::123");

    expect(provisioner.createUser).toHaveBeenCalledWith(
      "kyd-alice",
      expect.arrayContaining([
        expect.objectContaining({ type: "CanActAs", party: "Alice::123" }),
        expect.objectContaining({ type: "CanReadAs", party: "Alice::123" }),
      ]),
      "Alice::123",
    );
    expect(provisioner.grantUserRights).not.toHaveBeenCalled();
  });

  it("falls back to granting rights (idempotently) when the user already exists", async () => {
    const provisioner = fakeProvisioner(vi.fn().mockRejectedValue(new Error("ALREADY_EXISTS")));
    await provisionUser(provisioner, "kyd-alice", "Alice::123");

    expect(provisioner.grantUserRights).toHaveBeenCalledWith(
      "kyd-alice",
      expect.arrayContaining([
        expect.objectContaining({ type: "CanActAs", party: "Alice::123" }),
        expect.objectContaining({ type: "CanReadAs", party: "Alice::123" }),
      ]),
    );
  });

  it("propagates a failure from the grant fallback (no silent success)", async () => {
    const provisioner = fakeProvisioner(vi.fn().mockRejectedValue(new Error("conflict")));
    provisioner.grantUserRights.mockRejectedValue(new Error("ledger unreachable"));
    await expect(provisionUser(provisioner, "kyd-alice", "Alice::123")).rejects.toThrow("ledger unreachable");
  });
});
