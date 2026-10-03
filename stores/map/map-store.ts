import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { ColorMode, OverlayMode } from "@/lib/map/system-colors";

export type LineType = "normal" | "constellation" | "regional";
export type LabelType = "system" | "constellation" | "region";

const DEFAULT_VISIBLE_LINES: Record<LineType, boolean> = {
  normal: true,
  constellation: true,
  regional: true,
};

const DEFAULT_VISIBLE_LABELS: Record<LabelType, boolean> = {
  system: true,
  constellation: true,
  region: true,
};

export const DEFAULT_POINT_SCALE = 1.6;
export const DEFAULT_OVERLAY_OPACITY = 0.8;

const OVERLAY_MODES: readonly OverlayMode[] = ["none", "sovereignty", "hot"];

type MapState = {
  showAllLines: boolean;
  visibleLines: Record<LineType, boolean>;
  showAllLabels: boolean;
  visibleLabels: Record<LabelType, boolean>;
  enableKillFeed: boolean;
  showCapsulesInFeed: boolean;
  showKillFlash: boolean;
  hoveredSystemIndex: number | null;
  show3D: boolean;
  morphActive: boolean;
  colorMode: ColorMode;
  pointScale: number;
  overlay: OverlayMode;
  overlayOpacity: number;
  setShowAllLines: (show: boolean) => void;
  setLineVisibility: (type: LineType, visible: boolean) => void;
  setShowAllLabels: (show: boolean) => void;
  setLabelVisibility: (type: LabelType, visible: boolean) => void;
  setEnableKillFeed: (enable: boolean) => void;
  setShowCapsulesInFeed: (show: boolean) => void;
  setShowKillFlash: (show: boolean) => void;
  setHoveredSystemIndex: (index: number | null) => void;
  setShow3D: (v: boolean) => void;
  setMorphActive: (v: boolean) => void;
  setColorMode: (mode: ColorMode) => void;
  setPointScale: (scale: number) => void;
  setOverlay: (mode: OverlayMode) => void;
  setOverlayOpacity: (v: number) => void;
};

export function mapPartialize(state: MapState): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  if (state.showAllLines) out.showAllLines = state.showAllLines;
  const hasNonDefaultLine = (
    Object.keys(DEFAULT_VISIBLE_LINES) as LineType[]
  ).some((k) => state.visibleLines[k] !== DEFAULT_VISIBLE_LINES[k]);
  if (hasNonDefaultLine) out.visibleLines = state.visibleLines;

  if (!state.showAllLabels) out.showAllLabels = state.showAllLabels;
  const hasNonDefaultLabel = (
    Object.keys(DEFAULT_VISIBLE_LABELS) as LabelType[]
  ).some((k) => state.visibleLabels[k] !== DEFAULT_VISIBLE_LABELS[k]);
  if (hasNonDefaultLabel) out.visibleLabels = state.visibleLabels;

  if (!state.enableKillFeed) out.enableKillFeed = state.enableKillFeed;
  if (!state.showCapsulesInFeed)
    out.showCapsulesInFeed = state.showCapsulesInFeed;
  if (!state.showKillFlash) out.showKillFlash = state.showKillFlash;
  if (state.show3D) out.show3D = state.show3D;
  if (state.colorMode !== "activity") out.colorMode = state.colorMode;
  if (state.pointScale !== DEFAULT_POINT_SCALE)
    out.pointScale = state.pointScale;
  if (state.overlay !== "none") out.overlay = state.overlay;
  if (state.overlayOpacity !== DEFAULT_OVERLAY_OPACITY)
    out.overlayOpacity = state.overlayOpacity;
  return out;
}

export function mapMerge(
  persistedState: unknown,
  currentState: MapState,
): MapState {
  const p = (persistedState ?? {}) as Record<string, unknown>;
  return {
    ...currentState,
    showAllLines: (p.showAllLines as boolean) ?? currentState.showAllLines,
    visibleLines:
      (p.visibleLines as Record<LineType, boolean>) ??
      currentState.visibleLines,
    showAllLabels: (p.showAllLabels as boolean) ?? currentState.showAllLabels,
    visibleLabels:
      (p.visibleLabels as Record<LabelType, boolean>) ??
      currentState.visibleLabels,
    enableKillFeed:
      (p.enableKillFeed as boolean) ?? currentState.enableKillFeed,
    showCapsulesInFeed:
      (p.showCapsulesInFeed as boolean) ?? currentState.showCapsulesInFeed,
    showKillFlash: (p.showKillFlash as boolean) ?? currentState.showKillFlash,
    show3D: (p.show3D as boolean) ?? currentState.show3D,
    colorMode: (p.colorMode as ColorMode) ?? currentState.colorMode,
    pointScale: (p.pointScale as number) ?? currentState.pointScale,
    overlay: (OVERLAY_MODES as readonly unknown[]).includes(p.overlay)
      ? (p.overlay as OverlayMode)
      : p.showSovereignty === true
        ? "sovereignty"
        : currentState.overlay,
    overlayOpacity:
      (p.overlayOpacity as number | undefined) ??
      (p.sovOpacity as number | undefined) ??
      currentState.overlayOpacity,
  };
}

export const useMapStore = create<MapState>()(
  persist(
    (set) => ({
      showAllLines: false,
      visibleLines: { ...DEFAULT_VISIBLE_LINES },
      showAllLabels: true,
      visibleLabels: { ...DEFAULT_VISIBLE_LABELS },
      enableKillFeed: true,
      showCapsulesInFeed: true,
      showKillFlash: true,
      hoveredSystemIndex: null,
      show3D: false,
      morphActive: false,
      colorMode: "activity",
      pointScale: DEFAULT_POINT_SCALE,
      overlay: "none",
      overlayOpacity: DEFAULT_OVERLAY_OPACITY,

      setShowAllLines: (show) => set({ showAllLines: show }),
      setLineVisibility: (type, visible) =>
        set((state) => ({
          visibleLines: {
            ...state.visibleLines,
            [type]: visible,
          },
        })),
      setShowAllLabels: (show) => set({ showAllLabels: show }),
      setLabelVisibility: (type, visible) =>
        set((state) => ({
          visibleLabels: {
            ...state.visibleLabels,
            [type]: visible,
          },
        })),
      setEnableKillFeed: (enable) => set({ enableKillFeed: enable }),
      setShowCapsulesInFeed: (show) => set({ showCapsulesInFeed: show }),
      setShowKillFlash: (show) => set({ showKillFlash: show }),
      setHoveredSystemIndex: (index) => set({ hoveredSystemIndex: index }),
      setShow3D: (v) => set({ show3D: v }),
      setMorphActive: (v) => set({ morphActive: v }),
      setColorMode: (colorMode) => set({ colorMode }),
      setPointScale: (pointScale) => set({ pointScale }),
      setOverlay: (overlay) => set({ overlay }),
      setOverlayOpacity: (overlayOpacity) => set({ overlayOpacity }),
    }),
    {
      name: "map-settings",
      storage: createJSONStorage(() => localStorage),

      partialize: mapPartialize,
      merge: mapMerge,
    },
  ),
);

export function useLineVisibility() {
  return useMapStore(
    useShallow((s) => ({
      showAllLines: s.showAllLines,
      visibleLines: s.visibleLines,
    })),
  );
}

export function useLabelVisibility() {
  return useMapStore(
    useShallow((s) => ({
      showAllLabels: s.showAllLabels,
      visibleLabels: s.visibleLabels,
    })),
  );
}

export function edgeTypeToKey(edgeType: number): LineType {
  switch (edgeType) {
    case 1:
      return "normal";
    case 2:
      return "constellation";
    case 3:
      return "regional";
    default:
      return "normal";
  }
}
