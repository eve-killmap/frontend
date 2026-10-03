import { describe, it, expect } from "vitest";
import { decideCollapse, INITIAL_COLLAPSE } from "@/lib/ui/collapse-labels";

describe("decideCollapse", () => {
  it("stays expanded while the labelled row fits", () => {
    const s = decideCollapse(INITIAL_COLLAPSE, 1000, 800);
    expect(s).toEqual({ collapsed: false, expandedWidth: 800 });
  });

  it("collapses once the labelled row is wider than the space and remembers that width", () => {
    const s = decideCollapse(INITIAL_COLLAPSE, 700, 800);
    expect(s).toEqual({ collapsed: true, expandedWidth: 800 });
  });

  it("ignores the narrower collapsed measurement so it cannot flip-flop", () => {
    const collapsed = decideCollapse(INITIAL_COLLAPSE, 700, 800);
    const again = decideCollapse(collapsed, 700, 400);
    expect(again).toEqual({ collapsed: true, expandedWidth: 800 });
  });

  it("re-expands only when the space reaches the remembered labelled width", () => {
    const collapsed = decideCollapse(INITIAL_COLLAPSE, 700, 800);
    expect(decideCollapse(collapsed, 799, 400).collapsed).toBe(true);
    const expanded = decideCollapse(collapsed, 800, 400);
    expect(expanded.collapsed).toBe(false);
    expect(expanded.expandedWidth).toBe(800);
  });

  it("refreshes the remembered width from a fresh expanded measurement", () => {
    const expanded = decideCollapse(INITIAL_COLLAPSE, 1000, 800);
    expect(decideCollapse(expanded, 1000, 850).expandedWidth).toBe(850);
  });
});
