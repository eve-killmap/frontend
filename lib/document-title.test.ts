import { describe, it, expect } from "vitest";
import { formatTitle } from "@/lib/document-title";

describe("formatTitle", () => {
  it("returns the base title for null", () => {
    expect(formatTitle(null)).toBe("EVE Killmap");
  });
  it("formats a page title with the separator", () => {
    expect(formatTitle("Jita")).toBe("Jita - EVE Killmap");
  });
  it("leaves non-ASCII system names intact", () => {
    expect(formatTitle("Saï")).toBe("Saï - EVE Killmap");
  });
});
