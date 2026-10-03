import { create } from "zustand";
import * as THREE from "three";

const DEFAULT_LAYOUT = Object.freeze({ visible: true });

type IconMeta = {
  id: number;
  getWorldPos: (out: THREE.Vector3) => THREE.Vector3;
  priority: number;
};

type IconLayout = {
  visible: boolean;
};

type State = {
  metas: Map<number, IconMeta>;
  layout: Map<number, IconLayout>;
  register: (meta: IconMeta) => () => void;
  setLayoutNext: (next: Map<number, IconLayout>) => void;
};

export const useIconLayoutStore = create<State>((set, get) => ({
  metas: new Map(),
  layout: new Map(),

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

  setLayoutNext: (next) => {
    const prev = get().layout;

    let changed = prev.size !== next.size;
    const merged = new Map<number, IconLayout>();

    for (const [id, n] of next) {
      const p = prev.get(id);
      if (p && p.visible === n.visible) {
        merged.set(id, p);
      } else {
        merged.set(id, n);
        changed = true;
      }
    }

    if (changed) set({ layout: merged });
  },
}));

export function useIconLayout(id: number) {
  return useIconLayoutStore((s) => s.layout.get(id) ?? DEFAULT_LAYOUT);
}
