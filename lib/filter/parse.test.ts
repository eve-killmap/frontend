import { describe, it, expect } from "vitest";
import { parseFilterParams } from "./parse";
import { serializeFilter } from "./serialize";
import { FilterCondition } from "./types";

function paramsFor(tokens: string[]): URLSearchParams {
  const p = new URLSearchParams();
  for (const t of tokens) p.append("f", t);
  return p;
}

describe("parseFilterParams", () => {
  it("round-trips serialized tokens back to ids-only conditions", () => {
    const conditions: FilterCondition[] = [
      {
        uid: "a",
        attribute: "alliance",
        side: "attacker",
        values: [
          { id: 99003581, name: "x" },
          { id: 99005338, name: "y" },
        ],
      },
      {
        uid: "b",
        attribute: "ship",
        side: "victim",
        values: [{ id: 670, name: "Capsule" }],
      },
    ];
    const parsed = parseFilterParams(paramsFor(serializeFilter(conditions)));
    expect(parsed).toEqual([
      { attribute: "alliance", side: "attacker", ids: [99003581, 99005338] },
      { attribute: "ship", side: "victim", ids: [670] },
    ]);
  });
  it("parses war ids and war:any", () => {
    expect(parseFilterParams(paramsFor(["war:12345,23456"]))).toEqual([
      { attribute: "war", ids: [12345, 23456] },
    ]);
    expect(parseFilterParams(paramsFor(["war:any"]))).toEqual([
      { attribute: "war", warAny: true, ids: [] },
    ]);
  });
  it("ignores malformed tokens", () => {
    expect(
      parseFilterParams(
        paramsFor([
          "alliance:sideways:1",
          "bogus",
          "ship:victim:-3",
          "ship:victim:",
        ]),
      ),
    ).toEqual([]);
  });
  it("rejects non-canonical id forms from hand-crafted URLs", () => {
    const p = parseFilterParams(
      new URLSearchParams("f=character:victim:1e5,0x10,5.0,42"),
    );
    expect(p[0].ids).toEqual([42]);
  });
  it("rejects ids above Number.MAX_SAFE_INTEGER", () => {
    const p = parseFilterParams(
      new URLSearchParams("f=character:victim:9007199254740993,42"),
    );
    expect(p[0].ids).toEqual([42]);
  });
});
