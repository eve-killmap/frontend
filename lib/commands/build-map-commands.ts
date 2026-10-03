import type { Command } from "./types";
import {
  ColorMode,
  OverlayMode,
  COLOR_MODE_OPTIONS,
  OVERLAY_MODE_OPTIONS,
  colorModeAllowedOn,
  overlayAllowedOn,
} from "@/lib/map/system-colors";

export type MapPanel = "filter" | "share" | "settings" | "top" | "leaderboards";

export interface MapCommandInput {
  mapType: string;
  colorMode: () => ColorMode;
  setColorMode: (mode: ColorMode) => void;
  overlay: () => OverlayMode;
  setOverlay: (mode: OverlayMode) => void;
  show3D: () => boolean;
  setShow3D: (v: boolean) => void;
  resetCamera: () => void;
  enableKillFeed: () => boolean;
  setEnableKillFeed: (v: boolean) => void;
  showKillFlash: () => boolean;
  setShowKillFlash: (v: boolean) => void;
  showDebugStats: () => boolean;
  setShowDebugStats: (v: boolean) => void;
  openPanel: (panel: MapPanel) => void;
  exportPng: () => void;
}

const PANELS: { key: MapPanel; label: string }[] = [
  { key: "filter", label: "Open Filter panel" },
  { key: "share", label: "Open Share panel" },
  { key: "settings", label: "Open Settings panel" },
  { key: "top", label: "Open Top Systems" },
  { key: "leaderboards", label: "Open Leaderboards" },
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
    group: "map",
    keywords,
    state: () => (get() ? "on" : "off"),
    run: () => set(!get()),
  };
}

export function buildMapCommands(input: MapCommandInput): Command[] {
  const cmds: Command[] = [];

  for (const opt of COLOR_MODE_OPTIONS) {
    if (!colorModeAllowedOn(opt.value, input.mapType)) continue;
    cmds.push({
      id: `map.color.${opt.value}`,
      label: `Colour by ${opt.label}`,
      group: "map",
      keywords: ["color", "colour", "mode"],
      state: () => (input.colorMode() === opt.value ? "active" : undefined),
      run: () => input.setColorMode(opt.value),
    });
  }

  for (const opt of OVERLAY_MODE_OPTIONS) {
    if (!overlayAllowedOn(opt.value, input.mapType)) continue;
    cmds.push({
      id: `map.overlay.${opt.value}`,
      label: `Overlay: ${opt.label}`,
      group: "map",
      keywords: ["overlay", "sov", "heat"],
      state: () => (input.overlay() === opt.value ? "active" : undefined),
      run: () => input.setOverlay(opt.value),
    });
  }

  if (input.mapType === "new-eden") {
    cmds.push(
      toggle("map.layout3d", "3D layout", input.show3D, input.setShow3D, [
        "2d",
        "3d",
        "layout",
        "morph",
      ]),
    );
  }

  cmds.push({
    id: "map.camera.reset",
    label: "Reset camera",
    group: "map",
    keywords: ["view", "zoom", "home"],
    run: input.resetCamera,
  });

  cmds.push({
    id: "export.map.png",
    label: "Export PNG",
    group: "map",
    keywords: ["download", "image", "screenshot", "save"],
    run: input.exportPng,
  });

  cmds.push(
    toggle(
      "map.toggle.feed",
      "Live kill feed",
      input.enableKillFeed,
      input.setEnableKillFeed,
      ["feed", "live"],
    ),
    toggle(
      "map.toggle.flash",
      "Live kill flashes",
      input.showKillFlash,
      input.setShowKillFlash,
      ["flash", "ring"],
    ),
    toggle(
      "map.toggle.debug",
      "Debug stats",
      input.showDebugStats,
      input.setShowDebugStats,
      ["fps", "debug", "stats"],
    ),
  );

  for (const p of PANELS) {
    cmds.push({
      id: `panel.map.${p.key}`,
      label: p.label,
      group: "panels",
      keywords: ["panel", "open"],
      run: () => input.openPanel(p.key),
    });
  }

  return cmds;
}
