import { describe, it, expect } from "vitest";
import { isNewEdenSystem } from "./space";

describe("isNewEdenSystem", () => {
  it("accepts the New Eden id range", () => {
    expect(isNewEdenSystem(30000001)).toBe(true);
    expect(isNewEdenSystem(30000142)).toBe(true);
    expect(isNewEdenSystem(30100084)).toBe(true);
    expect(isNewEdenSystem(30999999)).toBe(true);
  });

  it("rejects ids below and above the range at the boundaries", () => {
    expect(isNewEdenSystem(29999999)).toBe(false);
    expect(isNewEdenSystem(30000000)).toBe(true);
    expect(isNewEdenSystem(31000000)).toBe(false);
  });

  it("rejects Anoikis, Abyssal and Tutorial systems", () => {
    expect(isNewEdenSystem(31000001)).toBe(false);
    expect(isNewEdenSystem(31002604)).toBe(false);
    expect(isNewEdenSystem(32000001)).toBe(false);
    expect(isNewEdenSystem(34000001)).toBe(false);
  });
});
