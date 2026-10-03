import { describe, it, expect } from "vitest";
import { formatDistance } from "./format-distance";

const AU = 149_597_870_700;

describe("formatDistance", () => {
  it("rounds to the nearest km", () => {
    expect(formatDistance(1_499)).toBe("1 km");
    expect(formatDistance(1_500)).toBe("2 km");
  });

  it("shows the full km distance (no abbreviation) below 0.1 AU", () => {
    expect(formatDistance(500_000)).toBe("500 km");
    expect(formatDistance(12_345_000)).toBe("12,345 km");
    expect(formatDistance(1_000_000_000)).toBe("1,000,000 km");
  });

  it("keeps showing km just below the 0.1 AU threshold", () => {
    expect(formatDistance(0.1 * AU - 1000)).toBe("14,959,786 km");
  });

  it("switches to AU at 0.1 AU and up, to two decimals", () => {
    expect(formatDistance(0.1 * AU)).toBe("0.10 AU");
    expect(formatDistance(AU)).toBe("1.00 AU");
    expect(formatDistance(10 * AU)).toBe("10.00 AU");
  });

  it("keeps two-decimal AU for large distances", () => {
    expect(formatDistance(1e13)).toBe("66.85 AU");
  });
});
