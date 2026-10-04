import { describe, it, expect } from "vitest";
import {
  killColorLegend,
  ALL_OTHERS_LABEL,
} from "@/lib/export/kill-color-legend";

const typeData = {
  groupNames: { "25": "Frigate", "419": "Combat Battlecruiser" },
  typeNames: { "587": "Rifter", "16227": "Ferox" },
};

describe("killColorLegend", () => {
  it("is empty when no group or type colour has been changed", () => {
    expect(
      killColorLegend(
        { defaultColor: "#88ccff", groupColors: {}, typeColors: {} },
        typeData,
      ),
    ).toEqual([]);
  });

  it("is empty even when only the default colour was changed", () => {
    expect(
      killColorLegend(
        { defaultColor: "#ff0000", groupColors: {}, typeColors: {} },
        typeData,
      ),
    ).toEqual([]);
  });

  it("lists changed groups, then changed types, then the default as All others", () => {
    const legend = killColorLegend(
      {
        defaultColor: "#ff0000",
        groupColors: { 419: "#00ff00", 25: "#0000ff" },
        typeColors: { 16227: "#ffff00", 587: "#00ffff" },
      },
      typeData,
    );
    expect(legend).toEqual([
      {
        type: "swatches",
        title: "Kill colors",
        columns: 1,
        entries: [
          { label: "Combat Battlecruiser", hex: "#00ff00" },
          { label: "Frigate", hex: "#0000ff" },
          { label: "Ferox", hex: "#ffff00" },
          { label: "Rifter", hex: "#00ffff" },
          { label: ALL_OTHERS_LABEL, hex: "#ff0000" },
        ],
      },
    ]);
  });

  it("merges groups and types that share a colour into one comma-separated row", () => {
    const [block] = killColorLegend(
      {
        defaultColor: "#88ccff",
        groupColors: { 419: "#FF0000", 25: "#0000ff" },
        typeColors: { 16227: "#ff0000", 587: "#ff0000" },
      },
      typeData,
    );
    if (block.type !== "swatches") throw new Error("expected swatches");
    expect(block.entries).toEqual([
      { label: "Combat Battlecruiser, Ferox, Rifter", hex: "#ff0000" },
      { label: "Frigate", hex: "#0000ff" },
      { label: ALL_OTHERS_LABEL, hex: "#88ccff" },
    ]);
  });

  it("keeps All others separate even when a custom colour equals the default", () => {
    const [block] = killColorLegend(
      {
        defaultColor: "#ff0000",
        groupColors: { 25: "#ff0000" },
        typeColors: {},
      },
      typeData,
    );
    if (block.type !== "swatches") throw new Error("expected swatches");
    expect(block.entries.map((e) => e.label)).toEqual([
      "Frigate",
      ALL_OTHERS_LABEL,
    ]);
  });

  it("falls back to an id label for an unknown group or type", () => {
    const [block] = killColorLegend(
      {
        defaultColor: "#88ccff",
        groupColors: { 9999: "#111111" },
        typeColors: { 8888: "#222222" },
      },
      typeData,
    );
    expect(block.type).toBe("swatches");
    if (block.type !== "swatches") return;
    expect(block.entries.map((e) => e.label)).toEqual([
      "Group 9999",
      "Type 8888",
      ALL_OTHERS_LABEL,
    ]);
  });
});
