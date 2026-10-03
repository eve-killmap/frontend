import { describe, it, expect } from "vitest";
import { stripFilterParams } from "./url";

describe("stripFilterParams", () => {
  it("removes a single f param, leaving an empty search", () => {
    expect(stripFilterParams("?f=character:victim:123")).toBe("");
  });
  it("removes all f params while keeping the others", () => {
    expect(
      stripFilterParams("?f=alliance:attacker:1&g=2&f=ship:victim:670"),
    ).toBe("?g=2");
  });
  it("returns the search unchanged when there is no f param", () => {
    expect(stripFilterParams("?g=2&h=3")).toBe("?g=2&h=3");
  });
  it("returns empty string for an empty search", () => {
    expect(stripFilterParams("")).toBe("");
  });
});
