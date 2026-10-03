import { describe, it, expect, beforeEach } from "vitest";
import { useFilterStore } from "./filter-store";

describe("useFilterStore", () => {
  beforeEach(() => useFilterStore.setState({ conditions: [] }));

  it("sets conditions via the action", () => {
    useFilterStore
      .getState()
      .setConditions([
        { uid: "a", attribute: "alliance", side: "victim", values: [] },
      ]);
    expect(useFilterStore.getState().conditions).toHaveLength(1);
  });

  it("prunes conditions with no selection, keeping filled ones and war:any", () => {
    const filled = {
      uid: "filled",
      attribute: "alliance" as const,
      side: "victim" as const,
      values: [{ id: 1, name: "Goonswarm" }],
    };
    const warAny = {
      uid: "war",
      attribute: "war" as const,
      values: [],
      warAny: true,
    };
    const empty = {
      uid: "empty",
      attribute: "ship" as const,
      side: "victim" as const,
      values: [],
    };
    useFilterStore.getState().setConditions([filled, warAny, empty]);
    useFilterStore.getState().pruneEmptyConditions();
    expect(useFilterStore.getState().conditions.map((c) => c.uid)).toEqual([
      "filled",
      "war",
    ]);
  });

  it("keeps the same array reference when nothing is pruned", () => {
    useFilterStore.getState().setConditions([
      {
        uid: "a",
        attribute: "alliance",
        side: "victim",
        values: [{ id: 1, name: "X" }],
      },
    ]);
    const before = useFilterStore.getState().conditions;
    useFilterStore.getState().pruneEmptyConditions();
    expect(useFilterStore.getState().conditions).toBe(before);
  });
});
