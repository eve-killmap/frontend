import { describe, it, expect } from "vitest";
import { slugify } from "@/lib/formatting/slugify";

describe("slugify", () => {
  it("lowercases a simple name", () => {
    expect(slugify("Amarr")).toBe("amarr");
  });
  it("preserves internal hyphens and digits", () => {
    expect(slugify("A-BL0V")).toBe("a-bl0v");
  });
  it("trims leading and trailing hyphens", () => {
    expect(slugify("-Foo-")).toBe("foo");
  });
});
