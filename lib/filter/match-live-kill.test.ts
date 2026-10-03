import { describe, it, expect } from "vitest";
import { killMatchesFilter } from "./match-live-kill";
import { FilterCondition } from "./types";
import { LiveKillBase } from "@/lib/schema/base-schema";

function kill(overrides: Partial<LiveKillBase> = {}): LiveKillBase {
  return {
    killmail_id: 1,
    killmail_time: 0,
    v_character_id: 100,
    v_corporation_id: 200,
    v_alliance_id: 300,
    v_ship_type_id: 670,
    a_character_ids: [900, 901],
    a_corporation_ids: [910],
    a_alliance_ids: [920],
    a_faction_ids: [],
    a_ship_type_ids: [24688],
    a_weapon_type_ids: [2456],
    ...overrides,
  };
}
function cond(
  c: Partial<FilterCondition> & { attribute: FilterCondition["attribute"] },
): FilterCondition {
  return { uid: "x", values: [], ...c };
}
function vals(...ids: number[]) {
  return ids.map((id) => ({ id, name: `n${id}` }));
}

describe("killMatchesFilter", () => {
  it("empty filter matches everything", () => {
    expect(killMatchesFilter(kill(), [])).toBe(true);
  });
  it("victim side matches the v_* id", () => {
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "alliance", side: "victim", values: vals(300) }),
      ]),
    ).toBe(true);
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "alliance", side: "victim", values: vals(999) }),
      ]),
    ).toBe(false);
  });
  it("attacker side tests membership in a_*_ids", () => {
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "character", side: "attacker", values: vals(901) }),
      ]),
    ).toBe(true);
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "character", side: "attacker", values: vals(100) }),
      ]),
    ).toBe(false);
  });
  it("involved matches victim OR attacker", () => {
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "corporation", side: "involved", values: vals(910) }),
      ]),
    ).toBe(true);
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "corporation", side: "involved", values: vals(200) }),
      ]),
    ).toBe(true);
  });
  it("ship victim + weapon (attacker-only)", () => {
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "ship", side: "victim", values: vals(670) }),
      ]),
    ).toBe(true);
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "weapon", values: vals(2456) }),
      ]),
    ).toBe(true);
    expect(
      killMatchesFilter(kill(), [
        cond({ attribute: "weapon", values: vals(1) }),
      ]),
    ).toBe(false);
  });
  it("war ids and war:any", () => {
    expect(
      killMatchesFilter(kill({ war_id: 55 }), [
        cond({ attribute: "war", warAny: true }),
      ]),
    ).toBe(true);
    expect(
      killMatchesFilter(kill(), [cond({ attribute: "war", warAny: true })]),
    ).toBe(false);
    expect(
      killMatchesFilter(kill({ war_id: 55 }), [
        cond({ attribute: "war", values: vals(55) }),
      ]),
    ).toBe(true);
  });
  it("treats an empty war condition as a no-op (matches everything)", () => {
    expect(killMatchesFilter(kill(), [cond({ attribute: "war" })])).toBe(true);
  });
  it("AND across conditions, OR within", () => {
    const both = [
      cond({ attribute: "alliance", side: "attacker", values: vals(920) }),
      cond({ attribute: "ship", side: "victim", values: vals(670, 671) }),
    ];
    expect(killMatchesFilter(kill(), both)).toBe(true);
    expect(killMatchesFilter(kill({ v_ship_type_id: 999 }), both)).toBe(false);
  });
});
