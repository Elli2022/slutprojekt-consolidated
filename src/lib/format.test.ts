import { describe, expect, it } from "vitest";

import { getInitials } from "./format";

describe("format helpers", () => {
  it("builds initials from a full name", () => {
    expect(getInitials("Ada Rivera")).toBe("AR");
  });

  it("ignores extra whitespace", () => {
    expect(getInitials("  Noah   Berg ")).toBe("NB");
  });
});
