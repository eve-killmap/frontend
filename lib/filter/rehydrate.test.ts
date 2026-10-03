import { describe, it, expect } from "vitest";
import { buildConditionsFromParsed } from "./rehydrate";
import { FilterValue } from "./types";
import { UniverseName } from "@/lib/api/universe-names";

function strip(conditions: ReturnType<typeof buildConditionsFromParsed>) {
  return conditions.map(({ uid: _uid, ...rest }) => rest);
}

describe("buildConditionsFromParsed", () => {
  const entityNames: Record<number, UniverseName> = {
    99003581: {
      category: "alliance",
      name: "Goonswarm",
      ticker: "CONDI",
      image_url: "img-a",
    },
    670: {
      category: "type",
      name: "Capsule",
      ticker: null,
      image_url: "img-ship",
    },
  };
  const noWars = new Map<number, FilterValue>();

  it("resolves entity and ship ids via /universe/names", () => {
    const out = strip(
      buildConditionsFromParsed(
        [
          { attribute: "alliance", side: "attacker", ids: [99003581] },
          { attribute: "ship", side: "victim", ids: [670] },
        ],
        entityNames,
        noWars,
      ),
    );
    expect(out).toEqual([
      {
        attribute: "alliance",
        side: "attacker",
        values: [
          {
            id: 99003581,
            name: "Goonswarm",
            image_url: "img-a",
            ticker: "CONDI",
          },
        ],
      },
      {
        attribute: "ship",
        side: "victim",
        values: [
          {
            id: 670,
            name: "Capsule",
            image_url: "img-ship",
            ticker: null,
          },
        ],
      },
    ]);
  });
  it("drops ids that cannot be resolved, and keeps war:any", () => {
    const out = strip(
      buildConditionsFromParsed(
        [
          { attribute: "alliance", side: "victim", ids: [123456] },
          { attribute: "war", warAny: true, ids: [] },
        ],
        {},
        noWars,
      ),
    );
    expect(out).toEqual([
      { attribute: "war", side: undefined, values: [], warAny: true },
    ]);
  });
  it("reuses prebuilt war chips (name + date detail), falling back to War #id", () => {
    const warValues = new Map<number, FilterValue>([
      [
        12345,
        { id: 12345, name: "Goons vs TEST", detail: "2024-01-01 – 2024-03-01" },
      ],
    ]);
    const out = strip(
      buildConditionsFromParsed(
        [{ attribute: "war", ids: [12345, 67890] }],
        {},
        warValues,
      ),
    );
    expect(out).toEqual([
      {
        attribute: "war",
        side: undefined,
        values: [
          {
            id: 12345,
            name: "Goons vs TEST",
            detail: "2024-01-01 – 2024-03-01",
          },
          { id: 67890, name: "War #67890" },
        ],
      },
    ]);
  });
});
