import { describe, it, expect } from "vitest";
import { sameVisibleMembership } from "./system-labels";

const v = (...idx: number[]) =>
  idx.map((index) => ({ index, name: "n", x: 0, y: 0 }));

describe("sameVisibleMembership", () => {
  it("true for identical index sets (ignoring object identity)", () => {
    expect(sameVisibleMembership(v(1, 2, 3), v(1, 2, 3))).toBe(true);
  });
  it("false when a system enters or leaves", () => {
    expect(sameVisibleMembership(v(1, 2, 3), v(1, 2))).toBe(false);
    expect(sameVisibleMembership(v(1, 2), v(1, 2, 4))).toBe(false);
  });
});
