import { describe, it, expect, beforeEach } from "vitest";
import { useApiHealthStore } from "./api-health-store";

describe("useApiHealthStore", () => {
  beforeEach(() => useApiHealthStore.setState({ healthy: null }));

  it("starts unknown", () => {
    expect(useApiHealthStore.getState().healthy).toBeNull();
  });

  it("records the health result", () => {
    useApiHealthStore.getState().setHealthy(false);
    expect(useApiHealthStore.getState().healthy).toBe(false);
    useApiHealthStore.getState().setHealthy(true);
    expect(useApiHealthStore.getState().healthy).toBe(true);
  });
});
