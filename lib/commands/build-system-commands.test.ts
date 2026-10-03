import { describe, it, expect, vi } from "vitest";
import {
  buildSystemCommands,
  type SystemCommandInput,
} from "./build-system-commands";

function make(over: Partial<SystemCommandInput> = {}) {
  const flags = {
    isActive: false,
    isPlaying: false,
    dataLoaded: true,
    enableKillFeed: true,
    showKillFlash: true,
    showDebugStats: false,
    star: true,
    planets: true,
    moons: false,
    belts: true,
  };
  const i: SystemCommandInput = {
    backPath: "/anoikis",
    navigate: vi.fn(),
    resetCamera: vi.fn(),
    sideView: vi.fn(),
    verticalView: vi.fn(),
    isActive: () => flags.isActive,
    isPlaying: () => flags.isPlaying,
    dataLoaded: () => flags.dataLoaded,
    startPlayback: vi.fn(),
    setPlaying: vi.fn(),
    enableKillFeed: () => flags.enableKillFeed,
    setEnableKillFeed: vi.fn(),
    showKillFlash: () => flags.showKillFlash,
    setShowKillFlash: vi.fn(),
    showDebugStats: () => flags.showDebugStats,
    setShowDebugStats: vi.fn(),
    starShown: () => flags.star,
    setStarShown: vi.fn(),
    planetsShown: () => flags.planets,
    setPlanetsShown: vi.fn(),
    moonsShown: () => flags.moons,
    setMoonsShown: vi.fn(),
    beltsShown: () => flags.belts,
    setBeltsShown: vi.fn(),
    openPanel: vi.fn(),
    exportPng: vi.fn(),
    exportCsv: vi.fn(),
    ...over,
  };
  return { i, flags, cmds: buildSystemCommands(i) };
}

describe("buildSystemCommands", () => {
  it("back to map is a navigation link to the originating map", () => {
    const { cmds, i } = make();
    const back = cmds.find((c) => c.id === "system.back")!;
    expect(back.group).toBe("navigation");
    expect(back.href).toBe("/anoikis");
    back.run();
    expect(i.navigate).toHaveBeenCalledWith("/anoikis");
  });

  it("camera presets call through", () => {
    const { cmds, i } = make();
    cmds.find((c) => c.id === "system.camera.side")!.run();
    expect(i.sideView).toHaveBeenCalled();
    cmds.find((c) => c.id === "system.camera.vertical")!.run();
    expect(i.verticalView).toHaveBeenCalled();
    cmds.find((c) => c.id === "system.camera.reset")!.run();
    expect(i.resetCamera).toHaveBeenCalled();
  });

  it("playback starts when inactive, pauses when playing, resumes when paused, and is disabled until data loads", () => {
    const a = make();
    const pb = a.cmds.find((c) => c.id === "system.playback")!;
    expect(pb.state!()).toBe("off");
    expect(pb.disabled!()).toBe(false);
    pb.run();
    expect(a.i.startPlayback).toHaveBeenCalled();

    a.flags.isActive = true;
    a.flags.isPlaying = true;
    expect(pb.state!()).toBe("on");
    pb.run();
    expect(a.i.setPlaying).toHaveBeenCalledWith(false);

    a.flags.isPlaying = false;
    pb.run();
    expect(a.i.setPlaying).toHaveBeenCalledWith(true);

    a.flags.dataLoaded = false;
    expect(pb.disabled!()).toBe(true);
  });

  it("mesh and feed toggles read on/off and flip", () => {
    const { cmds, i } = make();
    const moons = cmds.find((c) => c.id === "system.toggle.moons")!;
    expect(moons.state!()).toBe("off");
    moons.run();
    expect(i.setMoonsShown).toHaveBeenCalledWith(true);
    const feed = cmds.find((c) => c.id === "system.toggle.feed")!;
    expect(feed.state!()).toBe("on");
    feed.run();
    expect(i.setEnableKillFeed).toHaveBeenCalledWith(false);
  });

  it("panel commands open the named panel in order", () => {
    const { cmds, i } = make();
    expect(cmds.filter((c) => c.group === "panels").map((c) => c.id)).toEqual([
      "panel.system.filter",
      "panel.system.camera",
      "panel.system.playback",
      "panel.system.settings",
      "panel.system.stats",
      "panel.system.share",
    ]);
    cmds.find((c) => c.id === "panel.system.stats")!.run();
    expect(i.openPanel).toHaveBeenCalledWith("stats");
  });

  it("offers Export PNG and Export CSV rows, disabled until data loads", () => {
    const { cmds, i, flags } = make();
    const png = cmds.find((c) => c.id === "export.system.png")!;
    const csv = cmds.find((c) => c.id === "export.system.csv")!;
    expect(png.disabled!()).toBe(false);
    png.run();
    csv.run();
    expect(i.exportPng).toHaveBeenCalled();
    expect(i.exportCsv).toHaveBeenCalled();
    flags.dataLoaded = false;
    expect(png.disabled!()).toBe(true);
    expect(csv.disabled!()).toBe(true);
  });
});
