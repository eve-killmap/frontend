import { describe, it, expect } from "vitest";
import { warSearchUrl, warSearch, warDetails } from "./wars";

describe("warSearchUrl", () => {
  it("builds aggressor-only (unencoded kind:id)", () => {
    const u = warSearchUrl({ kind: "alliance", id: 99003581 }, null);
    expect(u).toContain("/wars/search?");
    expect(u).toContain("aggressor=alliance:99003581");
    expect(u).not.toContain("defender=");
  });
  it("builds defender-only", () => {
    const u = warSearchUrl(null, { kind: "corporation", id: 98000001 });
    expect(u).toContain("defender=corporation:98000001");
    expect(u).not.toContain("aggressor=");
  });
  it("builds both sides", () => {
    const u = warSearchUrl(
      { kind: "alliance", id: 1 },
      { kind: "corporation", id: 2 },
    );
    expect(u).toContain("aggressor=alliance:1");
    expect(u).toContain("defender=corporation:2");
  });
});

describe("warSearch / warDetails empty guards", () => {
  it("warSearch returns [] without a request when neither party is given", async () => {
    expect(await warSearch(null, null)).toEqual([]);
  });
  it("warDetails returns [] without a request for an empty id list", async () => {
    expect(await warDetails([])).toEqual([]);
  });
});
