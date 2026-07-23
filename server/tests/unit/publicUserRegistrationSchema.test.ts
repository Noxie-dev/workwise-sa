import { describe, expect, it } from "vitest";
import { publicUserRegistrationSchema } from "@shared/schema";

const validRegistration = {
  username: "candidate.test",
  password: "a-secure-password",
  email: "candidate@example.test",
  name: "Candidate Test",
};

describe("publicUserRegistrationSchema", () => {
  it.each([
    ["role", "admin"],
    ["firebaseUid", "attacker-controlled-uid"],
    ["referredByUserId", 1],
  ])("rejects the server-owned field %s", (field, value) => {
    const result = publicUserRegistrationSchema.safeParse({
      ...validRegistration,
      [field]: value,
    });

    expect(result.success).toBe(false);
  });

  it("accepts a minimal candidate registration", () => {
    const result = publicUserRegistrationSchema.safeParse(validRegistration);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("role");
      expect(result.data).not.toHaveProperty("firebaseUid");
    }
  });

  it("requires a production-strength password", () => {
    const result = publicUserRegistrationSchema.safeParse({
      ...validRegistration,
      password: "short",
    });

    expect(result.success).toBe(false);
  });
});
