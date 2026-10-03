import React, { useState, useCallback, useMemo } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useKillStore } from "@/stores/kill-store";
import {
  usePlaybackStore,
  PLAYBACK_SPEEDS,
  WINDOW_PRESETS,
} from "@/stores/system/playback-store";
import type { FadeMode } from "@/lib/kill/fade-mode";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import { TimeSelector } from "@/components/common/time-selector";
import { nowSeconds } from "@/lib/formatting/time";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";

interface SystemPlaybackProps {
  open: boolean;
  onToggle: () => void;
}

export const SystemPlayback = React.memo(function SystemPlayback({
  open,
  onToggle,
}: SystemPlaybackProps) {
  const ref = useDismissablePanel(open, onToggle);

  return (
    <div ref={ref} className="relative pointer-events-auto">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        aria-expanded={open}
        className="btn-glass"
        title="Playback"
      >
        <Play />
        <span className="btn-label">Playback</span>
      </Button>
      <Card
        className={`absolute top-full right-0 w-84 mt-2 max-w-[calc(100vw-2rem)] panel-glass ${open ? "" : "hidden"}`}
      >
        <CardContent className="px-3">
          <PlaybackConfigPanel onClose={onToggle} />
        </CardContent>
      </Card>
    </div>
  );
});

function PlaybackConfigPanel({ onClose }: { onClose: () => void }) {
  const data = useKillStore((s) => s.data);
  const startPlayback = usePlaybackStore((s) => s.startPlayback);
  const hasData = !!(data && data.count > 0);

  const dataStart = useMemo(() => {
    if (!data || data.count === 0) return nowSeconds() - 86400 * 7;
    return data.killmail_times[data.count - 1];
  }, [data]);
  const defaultEnd = useMemo(() => nowSeconds(), []);

  const [playbackRange, setPlaybackRange] = useState<[number, number] | null>(
    null,
  );

  const isActive = usePlaybackStore((s) => s.isActive);
  const speed = usePlaybackStore((s) => s.speed);
  const windowSeconds = usePlaybackStore((s) => s.windowSeconds);
  const fadeMode = usePlaybackStore((s) => s.fadeMode);

  const setSpeed = usePlaybackStore((s) => s.setSpeed);
  const setWindowSeconds = usePlaybackStore((s) => s.setWindowSeconds);
  const setFadeMode = usePlaybackStore((s) => s.setFadeMode);
  const setRange = usePlaybackStore((s) => s.setRange);

  const handleStart = useCallback(() => {
    const range: [number, number] = [
      playbackRange ? playbackRange[0] : dataStart,
      playbackRange ? playbackRange[1] : defaultEnd,
    ];
    setRange(range);
    playbackTimeState.currentTime = range[0];
    playbackTimeState.version++;
    startPlayback();
    onClose();
  }, [playbackRange, dataStart, defaultEnd, setRange, startPlayback, onClose]);

  return (
    <div className="space-y-2">
      <TimeSelector setTimeRange={setPlaybackRange} />

      <div className="space-y-1.5">
        <Label
          htmlFor="playback-visible-window"
          className="text-sm text-fg-secondary"
        >
          Visible Window
        </Label>
        <select
          id="playback-visible-window"
          value={windowSeconds}
          onChange={(e) => setWindowSeconds(Number(e.target.value))}
          className="w-full bg-panel border border-border rounded-xs px-2 py-1 text-xs cursor-pointer"
        >
          {WINDOW_PRESETS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="text-2xs text-fg-subtle leading-tight">
          The window of game time that kills are visible. For example, at a
          visible window of 1 day and a playback speed of 1 hour/s, kills will
          be visible for 24 seconds. Setting "At cap only" below nullifies this
          setting.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="playback-speed" className="text-sm text-fg-secondary">
          Playback Speed
        </Label>
        <select
          id="playback-speed"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          className="w-full bg-panel border border-border rounded-xs px-2 py-1 text-xs cursor-pointer"
        >
          {PLAYBACK_SPEEDS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <p className="text-2xs text-fg-subtle leading-tight">
          The speed to run the playback per second. Can be adjusted after
          playback is started.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm text-fg-secondary">Kill Fade</Label>
        <div className="flex gap-2">
          {(["always", "cap-triggered"] as FadeMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setFadeMode(mode)}
              className={`flex-1 h-7 border text-2xs transition-colors cursor-pointer ${
                fadeMode === mode
                  ? "border-capsuleer/60 bg-capsuleer/15 text-capsuleer"
                  : "border-border bg-transparent text-fg-muted hover:text-fg-secondary hover:border-border/80"
              }`}
            >
              {mode === "always" ? "Always fade" : "At cap only"}
            </button>
          ))}
        </div>
        <p className="text-2xs text-fg-subtle leading-tight">
          {fadeMode === "always"
            ? "Kills fade gradually as they age within the visible window."
            : "Kills remain at full opacity until the 100k limit is reached, then begin to fade, oldest first."}
        </p>
      </div>

      <Button
        className="w-full cursor-pointer"
        onClick={handleStart}
        disabled={!hasData || isActive}
      >
        <Play className="size-3.5 mr-1" />
        Start Playback
      </Button>
    </div>
  );
}
