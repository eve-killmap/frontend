import type { Command } from "./types";

export const MAP_ROUTES = [
  { mapType: "new-eden", path: "/", label: "New Eden map" },
  { mapType: "anoikis", path: "/anoikis", label: "Anoikis map" },
  {
    mapType: "abyssal-deadspace",
    path: "/abyssal-deadspace",
    label: "Abyssal Deadspace map",
  },
  { mapType: "tutorials", path: "/tutorials", label: "Tutorial system map" },
] as const;

export interface GlobalCommandInput {
  currentPath: string;
  navigate: (path: string) => void;
  openInfo: () => boolean;
  shortcutLabel: string;
}

export function buildGlobalCommands(input: GlobalCommandInput): Command[] {
  const cmds: Command[] = [];
  for (const r of MAP_ROUTES) {
    if (r.path === input.currentPath) continue;
    cmds.push({
      id: `nav.map.${r.mapType}`,
      label: r.label,
      group: "navigation",
      keywords: ["map", "go to"],
      href: r.path,
      run: () => input.navigate(r.path),
    });
  }
  if (input.currentPath !== "/about") {
    cmds.push({
      id: "nav.about",
      label: "About EVE Killmap",
      group: "navigation",
      keywords: ["info", "help", "faq", "credits"],
      href: "/about",
      run: () => input.navigate("/about"),
    });
  }
  cmds.push({
    id: "help.shortcuts",
    label: "Keyboard shortcuts",
    group: "help",
    keywords: ["keys", "hotkeys", "controls"],
    shortcut: input.shortcutLabel,
    run: () => {
      if (!input.openInfo()) input.navigate("/about");
    },
  });
  return cmds;
}
