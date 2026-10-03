import { describe, it, expect } from "vitest";
import { getIconURL } from "./icon-url";

describe("getIconURL", () => {
  it("maps a bracket icon id to its evetech-relative asset path", () => {
    expect(getIconURL(0)).toBe("brackets/asteroidBelt.png");
    expect(getIconURL(2)).toBe("brackets/moon.png");
    expect(getIconURL(7)).toBe("brackets/sun.png");
  });

  it("returns undefined for an out-of-range id", () => {
    expect(getIconURL(123)).toBeUndefined();
  });
});
