import { create } from "zustand";

interface ApiHealthState {
  healthy: boolean | null;
  setHealthy: (healthy: boolean) => void;
}

export const useApiHealthStore = create<ApiHealthState>((set) => ({
  healthy: null,
  setHealthy: (healthy) => set({ healthy }),
}));
