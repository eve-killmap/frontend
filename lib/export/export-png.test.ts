import { describe, it, expect, vi } from "vitest";
import { exportPng } from "./export-png";
import type { ExportOverlay } from "./paint-overlay";

const overlay: ExportOverlay = {
  kind: "map",
  title: "New Eden",
  subtitle: null,
  legend: [],
  timeLabel: "t",
  scale: 2,
};

describe("exportPng", () => {
  it("rejects with 'Scene not ready' when no capture bridge is registered and downloads nothing", async () => {
    const download = vi.fn();
    await expect(
      exportPng(overlay, "x.png", {
        capture: null,
        compose: async (b) => b,
        download,
      }),
    ).rejects.toThrow("Scene not ready");
    expect(download).not.toHaveBeenCalled();
  });

  it("captures at the overlay scale, composes, and downloads under the filename", async () => {
    const frame = new Blob(["frame"]);
    const composed = new Blob(["composed"]);
    const capture = vi.fn(async () => frame);
    const compose = vi.fn(async () => composed);
    const download = vi.fn();
    await exportPng(overlay, "map.png", { capture, compose, download });
    expect(capture).toHaveBeenCalledWith(2);
    expect(compose).toHaveBeenCalledWith(frame, overlay);
    expect(download).toHaveBeenCalledWith(composed, "map.png");
  });

  it("propagates a capture failure without downloading", async () => {
    const download = vi.fn();
    await expect(
      exportPng(overlay, "map.png", {
        capture: async () => {
          throw new Error("Capture produced no image");
        },
        compose: async (b) => b,
        download,
      }),
    ).rejects.toThrow("Capture produced no image");
    expect(download).not.toHaveBeenCalled();
  });
});
