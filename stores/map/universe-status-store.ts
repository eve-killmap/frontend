import { create } from "zustand";
import { UniverseStatus } from "@/lib/schema/base-schema";

interface UniverseStatusState {
  status: UniverseStatus | null;
  stale: boolean;
  setStatus: (status: UniverseStatus) => void;
  setStale: (stale: boolean) => void;
}

export const useUniverseStatusStore = create<UniverseStatusState>((set) => ({
  status: null,
  stale: false,
  setStatus: (status) => set({ status, stale: false }),
  setStale: (stale) => set({ stale }),
}));
