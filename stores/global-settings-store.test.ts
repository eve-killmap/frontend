import { describe, it, expect, afterEach } from "vitest";
import {
  globalSettingsMerge,
  globalSettingsPartialize,
  useGlobalSettingsStore,
} from "./global-settings-store";

const base = () => useGlobalSettingsStore.getState();

afterEach(() => {
  useGlobalSettingsStore.getState().setTriglavianFont(true);
  useGlobalSettingsStore.getState().setShowDebugStats(false);
});

describe("global-settings-store defaults and setters", () => {
  it("defaults to the Triglavian font on and debug stats off", () => {
    expect(base().triglavianFont).toBe(true);
    expect(base().showDebugStats).toBe(false);
  });
  it("setters update both flags", () => {
    base().setTriglavianFont(false);
    base().setShowDebugStats(true);
    expect(base().triglavianFont).toBe(false);
    expect(base().showDebugStats).toBe(true);
  });
});

describe("globalSettingsPartialize", () => {
  it("persists both flags, defaults included", () => {
    expect(globalSettingsPartialize(base())).toEqual({
      triglavianFont: true,
      showDebugStats: false,
    });
  });
  it("persists a disabled font and enabled debug stats", () => {
    expect(
      globalSettingsPartialize({
        ...base(),
        triglavianFont: false,
        showDebugStats: true,
      }),
    ).toEqual({ triglavianFont: false, showDebugStats: true });
  });
});

describe("globalSettingsMerge", () => {
  it("takes both flags from its persisted state", () => {
    const m = globalSettingsMerge(
      { triglavianFont: false, showDebugStats: true },
      base(),
    );
    expect(m.triglavianFont).toBe(false);
    expect(m.showDebugStats).toBe(true);
  });
  it("falls back to the defaults when a persisted flag is missing or malformed", () => {
    expect(globalSettingsMerge({}, base()).triglavianFont).toBe(true);
    expect(globalSettingsMerge({}, base()).showDebugStats).toBe(false);
    expect(globalSettingsMerge(undefined, base()).triglavianFont).toBe(true);
    const malformed = globalSettingsMerge(
      { triglavianFont: "no", showDebugStats: 1 },
      base(),
    );
    expect(malformed.triglavianFont).toBe(true);
    expect(malformed.showDebugStats).toBe(false);
  });
  it("keeps the setters from the current state", () => {
    const m = globalSettingsMerge({}, base());
    expect(typeof m.setTriglavianFont).toBe("function");
    expect(typeof m.setShowDebugStats).toBe("function");
  });
});
