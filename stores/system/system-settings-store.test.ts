import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

function fakeLocalStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: (name: string, value: string) => {
      map.set(name, value);
    },
    removeItem: (name: string) => {
      map.delete(name);
    },
    clear: () => {
      map.clear();
    },
  };
}

describe("system-settings-store persistence pause (shared-view guarantee)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", fakeLocalStorage());
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("pauses persistence for a shared view and never leaks shared values to localStorage", async () => {
    const store = await import("@/stores/system/system-settings-store");
    const {
      setCurrentSystemSlug,
      systemSettingsActions,
      getSystemSettingsState,
      setSettingsPersistPaused,
      snapshotCurrentSettings,
      restoreCurrentSettings,
      DEFAULT_MAX_KILLS,
    } = store;

    setCurrentSystemSlug("test-system");

    systemSettingsActions.setDefaultColor("#00ff00");
    const greenRaw = localStorage.getItem("system-settings");
    expect(greenRaw).not.toBeNull();
    expect(greenRaw).toContain("test-system");
    expect(greenRaw).toContain("#00ff00");

    setSettingsPersistPaused(true);
    const snap = snapshotCurrentSettings();
    systemSettingsActions.setDefaultColor("#ff0000");
    expect(getSystemSettingsState().defaultColor).toBe("#ff0000");
    expect(localStorage.getItem("system-settings")).toBe(greenRaw);

    systemSettingsActions.setMaxKills(12345);
    expect(localStorage.getItem("system-settings")).toBe(greenRaw);

    restoreCurrentSettings(snap);
    setSettingsPersistPaused(false);
    expect(getSystemSettingsState().defaultColor).toBe("#00ff00");
    expect(getSystemSettingsState().maxKills).toBe(DEFAULT_MAX_KILLS);

    systemSettingsActions.setDefaultColor("#0000ff");
    const blueRaw = localStorage.getItem("system-settings");
    expect(blueRaw).toContain("#0000ff");
    expect(blueRaw).not.toContain("#00ff00");
  });
});
