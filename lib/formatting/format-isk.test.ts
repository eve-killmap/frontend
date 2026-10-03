import { describe, it, expect } from "vitest";
import { formatIsk } from "./format-isk";

describe("formatIsk", () => {
  it("returns '0' for zero or absent values", () => {
    expect(formatIsk(0)).toBe("0");
    expect(formatIsk(undefined)).toBe("0");
  });

  it("formats trillions, billions, and millions with a two-decimal suffix", () => {
    expect(formatIsk(2.5e12)).toBe("2.50t");
    expect(formatIsk(1.2e9)).toBe("1.20b");
    expect(formatIsk(3.4e6)).toBe("3.40m");
  });

  it("rounds to two decimals at each magnitude", () => {
    expect(formatIsk(3_456_000_000)).toBe("3.46b");
  });

  it("groups sub-million values without a suffix", () => {
    expect(formatIsk(12_345)).toBe((12_345).toLocaleString());
  });
});
