import { create } from "zustand";

interface KillHoverState {
  killId: number | null;
  shipTypeId: number | null;
  killTime: number | null;
  killPosition: [number, number, number] | null;
  mouseX: number;
  mouseY: number;
  setHovered: (
    killId: number,
    shipTypeId: number,
    killTime: number,
    killPosition: [number, number, number],
  ) => void;
  setMousePos: (x: number, y: number) => void;
  clearHovered: () => void;
}

export const useKillHoverStore = create<KillHoverState>((set) => ({
  killId: null,
  shipTypeId: null,
  killTime: null,
  killPosition: null,
  mouseX: 0,
  mouseY: 0,
  setHovered: (killId, shipTypeId, killTime, killPosition) =>
    set({ killId, shipTypeId, killTime, killPosition }),
  setMousePos: (mouseX, mouseY) => set({ mouseX, mouseY }),
  clearHovered: () =>
    set({ killId: null, shipTypeId: null, killTime: null, killPosition: null }),
}));
