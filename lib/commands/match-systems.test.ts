import { describe, it, expect } from "vitest";
import { matchSystems } from "./match-systems";

const NAMES = ["Jita", "J-CIJV", "Amarr", "Rens", "Jan", "Hek", "J100001"];

describe("matchSystems", () => {
  it("returns nothing below two characters", () => {
    expect(matchSystems("", NAMES)).toEqual([]);
    expect(matchSystems("j", NAMES)).toEqual([]);
    expect(matchSystems(" j ", NAMES)).toEqual([]);
  });

  it("ranks prefix matches before substring matches, case-insensitively", () => {
    expect(matchSystems("ja", NAMES)).toEqual(["Jan"]);
    expect(matchSystems("EN", NAMES)).toEqual(["Rens"]);
    expect(matchSystems("j1", NAMES)).toEqual(["J100001"]);
    expect(matchSystems("ar", NAMES)).toEqual(["Amarr"]);
  });

  it("treats regex-special characters literally", () => {
    expect(matchSystems("j-", NAMES)).toEqual(["J-CIJV"]);
    expect(() => matchSystems("(", NAMES)).not.toThrow();
  });

  it("caps the result and keeps input order inside each tier", () => {
    const many = Array.from({ length: 20 }, (_, i) => `Jx${i}`);
    const out = matchSystems("jx", many, 8);
    expect(out).toHaveLength(8);
    expect(out[0]).toBe("Jx0");
  });
});
