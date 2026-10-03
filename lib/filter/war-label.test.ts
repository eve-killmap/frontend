import { describe, it, expect } from "vitest";
import { warParticipantIds, warLabel, warDateRange } from "./war-label";
import { WarSearchResult } from "@/lib/schema/war-schema";
import { UniverseName } from "@/lib/api/universe-names";

function war(o: Partial<WarSearchResult> = {}): WarSearchResult {
  return {
    war_id: 5,
    declared: null,
    started: null,
    finished: null,
    retracted: null,
    mutual: false,
    aggressor_corporation_id: null,
    aggressor_alliance_id: null,
    defender_corporation_id: null,
    defender_alliance_id: null,
    ally_corporation_ids: [],
    ally_alliance_ids: [],
    ...o,
  };
}
const names: Record<number, UniverseName> = {
  99003581: {
    category: "alliance",
    name: "Goonswarm",
    ticker: "CONDI",
    image_url: "",
  },
  99005338: {
    category: "alliance",
    name: "Test Alliance",
    ticker: "TEST",
    image_url: "",
  },
};

describe("warParticipantIds", () => {
  it("collects non-null participant ids, deduped", () => {
    const ids = warParticipantIds(
      war({
        aggressor_alliance_id: 99003581,
        defender_alliance_id: 99005338,
        ally_corporation_ids: [1, 1],
        ally_alliance_ids: [2],
      }),
    );
    expect(ids.sort((a, b) => a - b)).toEqual([1, 2, 99003581, 99005338]);
  });
});

describe("warLabel", () => {
  it("names aggressor vs defender, alliance preferred over corp", () => {
    expect(
      warLabel(
        war({
          aggressor_alliance_id: 99003581,
          defender_alliance_id: 99005338,
        }),
        names,
      ),
    ).toBe("Goonswarm vs Test Alliance");
  });
  it("uses #id when a side's name is unresolved", () => {
    expect(
      warLabel(
        war({ aggressor_alliance_id: 99003581, defender_alliance_id: 123 }),
        names,
      ),
    ).toBe("Goonswarm vs #123");
  });
  it("falls back to War #id when neither side has an id", () => {
    expect(warLabel(war({ war_id: 7 }), names)).toBe("War #7");
  });
});

describe("warDateRange", () => {
  const jan1 = Date.UTC(2024, 0, 1) / 1000;
  const mar1 = Date.UTC(2024, 2, 1) / 1000;

  it("shows start – finish once the war is finished", () => {
    expect(warDateRange(war({ started: jan1, finished: mar1 }))).toBe(
      "2024-01-01 – 2024-03-01",
    );
  });
  it("shows start (Ongoing) while the war is active", () => {
    expect(warDateRange(war({ started: jan1, finished: null }))).toBe(
      "2024-01-01 (Ongoing)",
    );
  });
  it("falls back to the declared date when there is no start", () => {
    expect(
      warDateRange(war({ started: null, declared: jan1, finished: null })),
    ).toBe("2024-01-01 (Ongoing)");
  });
  it("returns empty string when no start date is known", () => {
    expect(warDateRange(war({ started: null, declared: null }))).toBe("");
  });
});
