import { create } from "zustand";
import type { FadeMode } from "@/lib/kill/fade-mode";

export const PLAYBACK_SPEEDS = [
  { label: "1 min/s", value: 60 },
  { label: "5 min/s", value: 300 },
  { label: "10 min/s", value: 600 },
  { label: "30 min/s", value: 1800 },
  { label: "1 hour/s", value: 3_600 },
  { label: "2 hours/s", value: 7_200 },
  { label: "4 hours/s", value: 14_400 },
  { label: "6 hours/s", value: 21_600 },
  { label: "12 hours/s", value: 43_200 },
  { label: "1 day/s", value: 86_400 },
  { label: "2 days/s", value: 172_800 },
  { label: "5 days/s", value: 432_000 },
  { label: "7 days/s", value: 604_800 },
  { label: "14 days/s", value: 1_209_600 },
  { label: "21 days/s", value: 1_814_400 },
  { label: "1 month/s", value: 2_592_000 },
] as const;

export const WINDOW_PRESETS = [
  { label: "10 min", value: 600 },
  { label: "30 min", value: 1800 },
  { label: "1 hour", value: 3_600 },
  { label: "2 hours", value: 7_200 },
  { label: "6 hours", value: 21_600 },
  { label: "12 hours", value: 43_200 },
  { label: "1 day", value: 86_400 },
  { label: "2 days", value: 172_800 },
  { label: "7 days", value: 604_800 },
  { label: "14 days", value: 1_209_600 },
  { label: "30 days", value: 2_592_000 },
  { label: "90 days", value: 7_776_000 },
  { label: "180 days", value: 15_552_000 },
  { label: "1 year", value: 31_536_000 },
  { label: "2 years", value: 63_072_000 },
] as const;

interface PlaybackState {
  isActive: boolean;
  isPlaying: boolean;
  autoStoppedAtCap: boolean;
  speed: number;
  windowSeconds: number;
  fadeMode: FadeMode;
  rangeStart: number;
  rangeEnd: number;

  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaying: (playing: boolean) => void;
  autoStopAtCap: () => void;
  setSpeed: (speed: number) => void;
  setWindowSeconds: (windowSeconds: number) => void;
  setFadeMode: (fadeMode: FadeMode) => void;
  setRange: (range: [number, number]) => void;
  reset: () => void;
}

export const usePlaybackStore = create<PlaybackState>((set) => ({
  isActive: false,
  isPlaying: false,
  autoStoppedAtCap: false,
  speed: PLAYBACK_SPEEDS[4].value,
  windowSeconds: WINDOW_PRESETS[6].value,
  fadeMode: "always",
  rangeStart: 0,
  rangeEnd: 0,

  startPlayback: () =>
    set({
      isActive: true,
      isPlaying: true,
      autoStoppedAtCap: false,
    }),

  stopPlayback: () =>
    set({ isActive: false, isPlaying: false, autoStoppedAtCap: false }),
  setPlaying: (isPlaying) => set({ isPlaying, autoStoppedAtCap: false }),
  autoStopAtCap: () => set({ isPlaying: false, autoStoppedAtCap: true }),
  setSpeed: (speed) => set({ speed }),
  setWindowSeconds: (windowSeconds) => set({ windowSeconds }),
  setFadeMode: (fadeMode) => set({ fadeMode }),
  setRange: (range) => set({ rangeStart: range[0], rangeEnd: range[1] }),
  reset: () =>
    set({
      isActive: false,
      isPlaying: false,
      autoStoppedAtCap: false,
      rangeStart: 0,
      rangeEnd: 0,
    }),
}));
