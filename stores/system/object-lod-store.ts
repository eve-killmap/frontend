import { create } from "zustand";
import * as THREE from "three";

type ObjectMeta = {
  id: number;
  getWorldPos: (out: THREE.Vector3) => THREE.Vector3;
  worldRadius: number;
  minPixelRadius: number;
  hysteresisPx?: number;
};

type ObjectLodState = { visible: boolean };

type State = {
  metas: Map<number, ObjectMeta>;
  state: Map<number, ObjectLodState>;
  register: (meta: ObjectMeta) => () => void;
  setNext: (next: Map<number, ObjectLodState>) => void;
};

export const useObjectLodStore = create<State>((set, get) => ({
  metas: new Map(),
  state: new Map(),

  register: (meta) => {
    const metas = new Map(get().metas);
    metas.set(meta.id, meta);
    set({ metas });
    return () => {
      const m = new Map(get().metas);
      m.delete(meta.id);
      set({ metas: m });
    };
  },

  setNext: (next) => {
    const prev = get().state;
    let changed = prev.size !== next.size;
    const merged = new Map<number, ObjectLodState>();

    for (const [id, n] of next) {
      const p = prev.get(id);
      if (p && p.visible === n.visible) {
        merged.set(id, p);
      } else {
        merged.set(id, n);
        changed = true;
      }
    }

    if (changed) {
      set({ state: merged });
    }
  },
}));

export function useObjectVisible(id: number) {
  return useObjectLodStore((s) => s.state.get(id)?.visible ?? true);
}
