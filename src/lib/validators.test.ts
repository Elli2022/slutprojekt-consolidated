import { describe, expect, it } from "vitest";

import {
  validatePost,
  validateProfileUpdate,
  validateSignIn,
  validateSignUp,
} from "./validators";

describe("validators", () => {
  it("rejects invalid sign-in emails", () => {
    expect(
      validateSignIn({
        email: "not-an-email",
        password: "welcome123",
      })
    ).toBe("Enter a valid email address.");
  });

  it("requires stronger sign-up passwords", () => {
    expect(
      validateSignUp({
        displayName: "Ada",
        email: "ada@example.com",
        password: "short",
        avatarUrl: "https://example.com/avatar.png",
        bio: "",
      })
    ).toBe("Use at least 8 characters for the password.");
  });

  it("accepts a valid profile update", () => {
    expect(
      validateProfileUpdate({
        displayName: "Ada Rivera",
        avatarUrl: "https://example.com/avatar.png",
        bio: "Calm and clear systems.",
      })
    ).toBeNull();
  });

  it("rejects overlong posts", () => {
    expect(
      validatePost({
        message: "a".repeat(281),
      })
    ).toBe("Posts should stay under 280 characters.");
  });
});
