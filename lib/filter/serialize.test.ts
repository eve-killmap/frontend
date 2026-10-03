import { describe, it, expect } from "vitest";
import {
  serializeFilter,
  filterToSearch,
  MAX_CONDITIONS,
  MAX_IDS_PER_CONDITION,
} from "./serialize";
import { FilterCondition } from "./types";

function cond(
  partial: Partial<FilterCondition> & {
    attribute: FilterCondition["attribute"];
  },
): FilterCondition {
  return { uid: "x", values: [], ...partial };
}
function vals(...ids: number[]) {
  return ids.map((id) => ({ id, name: `n${id}` }));
}

describe("serializeFilter", () => {
  it("sorts + dedups ids within a condition", () => {
    expect(
      serializeFilter([
        cond({
          attribute: "alliance",
          side: "attacker",
          values: vals(99005338, 99003581, 99003581),
        }),
      ]),
    ).toEqual(["alliance:attacker:99003581,99005338"]);
  });
  it("emits ship with its side and weapon without a side", () => {
    expect(
      serializeFilter([
        cond({ attribute: "ship", side: "victim", values: vals(670) }),
      ]),
    ).toEqual(["ship:victim:670"]);
    expect(
      serializeFilter([cond({ attribute: "weapon", values: vals(2456) })]),
    ).toEqual(["weapon:2456"]);
  });
  it("emits war ids and war:any", () => {
    expect(
      serializeFilter([cond({ attribute: "war", values: vals(34567, 12345) })]),
    ).toEqual(["war:12345,34567"]);
    expect(serializeFilter([cond({ attribute: "war", warAny: true })])).toEqual(
      ["war:any"],
    );
  });
  it("drops empty conditions and sorts conditions canonically", () => {
    const out = serializeFilter([
      cond({ attribute: "ship", side: "victim", values: vals(670) }),
      cond({ attribute: "alliance", side: "attacker", values: [] }),
      cond({ attribute: "character", side: "victim", values: vals(3) }),
    ]);
    expect(out).toEqual(["character:victim:3", "ship:victim:670"]);
  });
  it("builds a canonical query string by hand (no percent-encoding)", () => {
    expect(
      filterToSearch([
        cond({
          attribute: "alliance",
          side: "attacker",
          values: vals(99003581, 99005338),
        }),
      ]),
    ).toBe("?f=alliance:attacker:99003581,99005338");
    expect(filterToSearch([])).toBe("");
  });
  it("enforces the per-condition id limit by keeping the lowest ids (sorts before capping)", () => {
    const descending = vals(
      ...Array.from(
        { length: MAX_IDS_PER_CONDITION + 1 },
        (_, i) => MAX_IDS_PER_CONDITION + 1 - i,
      ),
    );
    const [token] = serializeFilter([
      cond({ attribute: "alliance", side: "victim", values: descending }),
    ]);
    const ids = token
      .split(":")[2]
      .split(",")
      .map((s) => Number(s));
    expect(ids).toEqual(
      Array.from({ length: MAX_IDS_PER_CONDITION }, (_, i) => i + 1),
    );
    expect(ids).not.toContain(MAX_IDS_PER_CONDITION + 1);
    expect(
      serializeFilter([
        cond({ attribute: "alliance", side: "victim", values: vals(1, 2) }),
      ]),
    ).toEqual(["alliance:victim:1,2"]);
  });
  it("enforces the condition-count limit by keeping the canonical-first conditions (sorts before capping)", () => {
    const reversed: FilterCondition[] = [
      cond({ attribute: "ship", side: "victim", values: vals(9) }),
      cond({ attribute: "faction", side: "victim", values: vals(8) }),
      cond({ attribute: "alliance", side: "attacker", values: vals(7) }),
      cond({ attribute: "alliance", side: "victim", values: vals(6) }),
      cond({ attribute: "corporation", side: "attacker", values: vals(5) }),
      cond({ attribute: "corporation", side: "victim", values: vals(4) }),
      cond({ attribute: "character", side: "involved", values: vals(3) }),
      cond({ attribute: "character", side: "attacker", values: vals(2) }),
      cond({ attribute: "character", side: "victim", values: vals(1) }),
    ];
    expect(reversed).toHaveLength(MAX_CONDITIONS + 1);
    const tokens = serializeFilter(reversed);
    expect(tokens).toEqual([
      "character:victim:1",
      "character:attacker:2",
      "character:involved:3",
      "corporation:victim:4",
      "corporation:attacker:5",
      "alliance:victim:6",
      "alliance:attacker:7",
      "faction:victim:8",
    ]);
    expect(tokens).not.toContain("ship:victim:9");
  });
  it("caps ids per condition and conditions overall", () => {
    const ids = Array.from({ length: 60 }, (_, i) => ({ id: i + 1, name: "" }));
    const tokens = serializeFilter([
      { uid: "a", attribute: "character", side: "victim", values: ids },
    ]);
    expect(tokens[0].split(":")[2].split(",").length).toBe(50);
  });
});
