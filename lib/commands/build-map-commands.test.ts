import { describe, it, expect, vi } from "vitest";
import { buildMapCommands, type MapCommandInput } from "./build-map-commands";

function input(mapType: string, over: Partial<MapCommandInput> = {}) {
  const state = {
    colorMode: "activity" as const,
    overlay: "none" as const,
    show3D: false,
    enableKillFeed: true,
    showKillFlash: true,
    showDebugStats: false,
  };
  const i: MapCommandInput = {
    mapType,
    colorMode: () => state.colorMode,
    setColorMode: vi.fn(),
    overlay: () => state.overlay,
    setOverlay: vi.fn(),
    show3D: () => state.show3D,
    setShow3D: vi.fn(),
    resetCamera: vi.fn(),
    enableKillFeed: () => state.enableKillFeed,
    setEnableKillFeed: vi.fn(),
    showKillFlash: () => state.showKillFlash,
    setShowKillFlash: vi.fn(),
    showDebugStats: () => state.showDebugStats,
    setShowDebugStats: vi.fn(),
    openPanel: vi.fn(),
    exportPng: vi.fn(),
    ...over,
  };
  return { i, state, cmds: buildMapCommands({ ...i, ...over }) };
}

describe("buildMapCommands", () => {
  it("offers only the colour modes allowed on the map and marks the active one", () => {
    const ne = input("new-eden");
    const neColors = ne.cmds.filter((c) => c.id.startsWith("map.color."));
    expect(neColors.map((c) => c.id)).toContain("map.color.sovereignty");
    expect(neColors.map((c) => c.id)).not.toContain("map.color.wormhole-class");
    expect(neColors.find((c) => c.id === "map.color.activity")!.state!()).toBe(
      "active",
    );
    expect(
      neColors.find((c) => c.id === "map.color.security")!.state!(),
    ).toBeUndefined();

    const an = input("anoikis");
    const anColors = an.cmds.filter((c) => c.id.startsWith("map.color."));
    expect(anColors.map((c) => c.id)).toContain("map.color.wormhole-class");
    expect(anColors.map((c) => c.id)).not.toContain("map.color.jumps");
  });

  it("offers Sovereignty overlay on New Eden only", () => {
    expect(
      input("new-eden").cmds.some((c) => c.id === "map.overlay.sovereignty"),
    ).toBe(true);
    expect(
      input("tutorials").cmds.some((c) => c.id === "map.overlay.sovereignty"),
    ).toBe(false);
    expect(
      input("tutorials").cmds.some((c) => c.id === "map.overlay.hot"),
    ).toBe(true);
  });

  it("offers the 2D/3D toggle on New Eden only and reads show3D", () => {
    const { cmds, i } = input("new-eden");
    const layout = cmds.find((c) => c.id === "map.layout3d")!;
    expect(layout.state!()).toBe("off");
    layout.run();
    expect(i.setShow3D).toHaveBeenCalledWith(true);
    expect(input("anoikis").cmds.some((c) => c.id === "map.layout3d")).toBe(
      false,
    );
  });

  it("runs setters for colour and overlay rows", () => {
    const { cmds, i } = input("new-eden");
    cmds.find((c) => c.id === "map.color.security")!.run();
    expect(i.setColorMode).toHaveBeenCalledWith("security");
    cmds.find((c) => c.id === "map.overlay.hot")!.run();
    expect(i.setOverlay).toHaveBeenCalledWith("hot");
  });

  it("toggles read on/off and flip", () => {
    const { cmds, i } = input("new-eden");
    const feed = cmds.find((c) => c.id === "map.toggle.feed")!;
    expect(feed.state!()).toBe("on");
    feed.run();
    expect(i.setEnableKillFeed).toHaveBeenCalledWith(false);
    const debug = cmds.find((c) => c.id === "map.toggle.debug")!;
    expect(debug.state!()).toBe("off");
    debug.run();
    expect(i.setShowDebugStats).toHaveBeenCalledWith(true);
  });

  it("panel commands open the named panel and reset camera calls through", () => {
    const { cmds, i } = input("new-eden");
    const panels = cmds.filter((c) => c.group === "panels").map((c) => c.id);
    expect(panels).toEqual([
      "panel.map.filter",
      "panel.map.share",
      "panel.map.settings",
      "panel.map.top",
      "panel.map.leaderboards",
    ]);
    cmds.find((c) => c.id === "panel.map.leaderboards")!.run();
    expect(i.openPanel).toHaveBeenCalledWith("leaderboards");
    cmds.find((c) => c.id === "map.camera.reset")!.run();
    expect(i.resetCamera).toHaveBeenCalled();
  });

  it("offers an Export PNG row that calls through", () => {
    const { cmds, i } = input("new-eden");
    const row = cmds.find((c) => c.id === "export.map.png")!;
    expect(row.group).toBe("map");
    row.run();
    expect(i.exportPng).toHaveBeenCalled();
  });
});
