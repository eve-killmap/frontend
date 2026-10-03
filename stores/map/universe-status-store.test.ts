import { describe, it, expect, beforeEach } from "vitest";
import { useUniverseStatusStore } from "./universe-status-store";

describe("useUniverseStatusStore", () => {
  beforeEach(() => {
    useUniverseStatusStore.setState({ status: null, stale: false });
  });

  it("starts with an unknown status", () => {
    expect(useUniverseStatusStore.getState().status).toBeNull();
    expect(useUniverseStatusStore.getState().stale).toBe(false);
  });

  it("stores an online response", () => {
    useUniverseStatusStore
      .getState()
      .setStatus({ online: true, players: 28431 });
    expect(useUniverseStatusStore.getState().status).toEqual({
      online: true,
      players: 28431,
    });
  });

  it("stores an offline response with no player count", () => {
    useUniverseStatusStore.getState().setStatus({ online: false });
    expect(useUniverseStatusStore.getState().status).toEqual({
      online: false,
    });
  });

  it("keeps the last known status when a poll fails", () => {
    useUniverseStatusStore.getState().setStatus({ online: true, players: 5 });
    useUniverseStatusStore.getState().setStale(true);
    expect(useUniverseStatusStore.getState().stale).toBe(true);
    expect(useUniverseStatusStore.getState().status).toEqual({
      online: true,
      players: 5,
    });
  });

  it("clears staleness when a poll lands", () => {
    useUniverseStatusStore.getState().setStale(true);
    useUniverseStatusStore.getState().setStatus({ online: true, players: 9 });
    expect(useUniverseStatusStore.getState().stale).toBe(false);
  });
});
