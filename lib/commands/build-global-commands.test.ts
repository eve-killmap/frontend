import { describe, it, expect, vi } from "vitest";
import { buildGlobalCommands } from "./build-global-commands";

function build(
  overrides: Partial<Parameters<typeof buildGlobalCommands>[0]> = {},
) {
  const navigate = vi.fn();
  const openInfo = vi.fn(() => true);
  const cmds = buildGlobalCommands({
    currentPath: "/",
    navigate,
    openInfo,
    shortcutLabel: "Ctrl K",
    ...overrides,
  });
  return { cmds, navigate, openInfo };
}

describe("buildGlobalCommands", () => {
  it("omits the current map and links the other three plus About", () => {
    const { cmds } = build({ currentPath: "/anoikis" });
    const nav = cmds.filter((c) => c.group === "navigation");
    expect(nav.map((c) => c.href)).toEqual([
      "/",
      "/abyssal-deadspace",
      "/tutorials",
      "/about",
    ]);
  });

  it("navigates when a map row runs", () => {
    const { cmds, navigate } = build();
    cmds.find((c) => c.id === "nav.map.anoikis")!.run();
    expect(navigate).toHaveBeenCalledWith("/anoikis");
  });

  it("shows all four maps on a non-map route", () => {
    const { cmds } = build({ currentPath: "/jita" });
    expect(cmds.filter((c) => c.id.startsWith("nav.map."))).toHaveLength(4);
  });

  it("omits the About row while already on /about, includes it elsewhere", () => {
    expect(
      build({ currentPath: "/about" }).cmds.some((c) => c.id === "nav.about"),
    ).toBe(false);
    expect(
      build({ currentPath: "/" }).cmds.some((c) => c.id === "nav.about"),
    ).toBe(true);
  });

  it("keyboard shortcuts opens the page's info dialog, else falls back to /about", () => {
    const a = build();
    const help = a.cmds.find((c) => c.id === "help.shortcuts")!;
    expect(help.group).toBe("help");
    expect(help.shortcut).toBe("Ctrl K");
    help.run();
    expect(a.openInfo).toHaveBeenCalled();
    expect(a.navigate).not.toHaveBeenCalled();

    const b = build({ openInfo: () => false });
    b.cmds.find((c) => c.id === "help.shortcuts")!.run();
    expect(b.navigate).toHaveBeenCalledWith("/about");
  });
});
