import type { Command } from "./types";

export type SystemPanel =
  "filter" | "camera" | "playback" | "settings" | "stats" | "share";

export interface SystemCommandInput {
  backPath: string;
  navigate: (path: string) => void;
  resetCamera: () => void;
  sideView: () => void;
  verticalView: () => void;
  isActive: () => boolean;
  isPlaying: () => boolean;
  dataLoaded: () => boolean;
  startPlayback: () => void;
  setPlaying: (playing: boolean) => void;
  enableKillFeed: () => boolean;
  setEnableKillFeed: (v: boolean) => void;
  showKillFlash: () => boolean;
  setShowKillFlash: (v: boolean) => void;
  showDebugStats: () => boolean;
  setShowDebugStats: (v: boolean) => void;
  starShown: () => boolean;
  setStarShown: (v: boolean) => void;
  planetsShown: () => boolean;
  setPlanetsShown: (v: boolean) => void;
  moonsShown: () => boolean;
  setMoonsShown: (v: boolean) => void;
  beltsShown: () => boolean;
  setBeltsShown: (v: boolean) => void;
  openPanel: (panel: SystemPanel) => void;
  exportPng: () => void;
  exportCsv: () => void;
}

const PANELS: { key: SystemPanel; label: string }[] = [
  { key: "filter", label: "Open Filter panel" },
  { key: "camera", label: "Open Camera panel" },
  { key: "playback", label: "Open Playback panel" },
  { key: "settings", label: "Open Settings panel" },
  { key: "stats", label: "Open Stats panel" },
  { key: "share", label: "Open Share panel" },
];

function toggle(
  id: string,
  label: string,
  get: () => boolean,
  set: (v: boolean) => void,
  keywords: string[],
): Command {
  return {
    id,
    label,
    group: "system",
    keywords,
    state: () => (get() ? "on" : "off"),
    run: () => set(!get()),
  };
}

export function buildSystemCommands(input: SystemCommandInput): Command[] {
  const cmds: Command[] = [
    {
      id: "system.back",
      label: "Back to map",
      group: "navigation",
      keywords: ["map", "return"],
      href: input.backPath,
      run: () => input.navigate(input.backPath),
    },
    {
      id: "system.camera.reset",
      label: "Reset camera",
      group: "system",
      keywords: ["view", "home"],
      run: input.resetCamera,
    },
    {
      id: "system.camera.side",
      label: "Side view",
      group: "system",
      keywords: ["camera", "horizontal", "x/z"],
      run: input.sideView,
    },
    {
      id: "system.camera.vertical",
      label: "Vertical view",
      group: "system",
      keywords: ["camera", "top-down"],
      run: input.verticalView,
    },
    {
      id: "export.system.png",
      label: "Export PNG",
      group: "system",
      keywords: ["download", "image", "screenshot", "save"],
      disabled: () => !input.dataLoaded(),
      run: input.exportPng,
    },
    {
      id: "export.system.csv",
      label: "Export CSV",
      group: "system",
      keywords: ["download", "spreadsheet", "kills", "save"],
      disabled: () => !input.dataLoaded(),
      run: input.exportCsv,
    },
    {
      id: "system.playback",
      label: "Toggle playback",
      group: "system",
      keywords: ["play", "pause", "replay", "timeline"],
      state: () => (input.isPlaying() ? "on" : "off"),
      disabled: () => !input.dataLoaded(),
      run: () => {
        if (input.isPlaying()) input.setPlaying(false);
        else if (input.isActive()) input.setPlaying(true);
        else input.startPlayback();
      },
    },
    toggle(
      "system.toggle.feed",
      "Live kill feed",
      input.enableKillFeed,
      input.setEnableKillFeed,
      ["feed", "live"],
    ),
    toggle(
      "system.toggle.flash",
      "Live kill flashes",
      input.showKillFlash,
      input.setShowKillFlash,
      ["flash"],
    ),
    toggle(
      "system.toggle.debug",
      "Debug stats",
      input.showDebugStats,
      input.setShowDebugStats,
      ["fps", "debug"],
    ),
    toggle("system.toggle.star", "Star", input.starShown, input.setStarShown, [
      "mesh",
      "sun",
    ]),
    toggle(
      "system.toggle.planets",
      "Planets",
      input.planetsShown,
      input.setPlanetsShown,
      ["mesh"],
    ),
    toggle(
      "system.toggle.moons",
      "Moons",
      input.moonsShown,
      input.setMoonsShown,
      ["mesh"],
    ),
    toggle(
      "system.toggle.belts",
      "Asteroid belts",
      input.beltsShown,
      input.setBeltsShown,
      ["mesh", "asteroids"],
    ),
  ];
  for (const p of PANELS) {
    cmds.push({
      id: `panel.system.${p.key}`,
      label: p.label,
      group: "panels",
      keywords: ["panel", "open"],
      run: () => input.openPanel(p.key),
    });
  }
  return cmds;
}
