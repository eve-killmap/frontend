import { describe, it, expect } from "vitest";
import { mapUniverseNames, UniverseName } from "./universe-names";

describe("mapUniverseNames", () => {
  it("keys the response by numeric id", () => {
    const raw: Record<string, UniverseName> = {
      "587": {
        category: "type",
        name: "Rifter",
        ticker: null,
        image_url: "u1",
      },
      "99003581": {
        category: "alliance",
        name: "Goonswarm",
        ticker: "CONDI",
        image_url: "u2",
      },
    };
    const out = mapUniverseNames(raw);
    expect(out[587].name).toBe("Rifter");
    expect(out[99003581].ticker).toBe("CONDI");
  });
});
