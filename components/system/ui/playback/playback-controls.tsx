import React, { useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  usePlaybackStore,
  PLAYBACK_SPEEDS,
} from "@/stores/system/playback-store";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import { secondsToDate } from "@/lib/formatting/time";

function formatEpoch(epoch: number): string {
  const d = secondsToDate(epoch);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
}

const SPEED_VALUES = PLAYBACK_SPEEDS.map((s) => s.value) as number[];

export const PlaybackControls = React.memo(function PlaybackControls({
  onShare,
}: {
  onShare?: () => void;
}) {
  const isActive = usePlaybackStore((s) => s.isActive);
  const isPlaying = usePlaybackStore((s) => s.isPlaying);
  const speed = usePlaybackStore((s) => s.speed);
  const rangeStart = usePlaybackStore((s) => s.rangeStart);
  const rangeEnd = usePlaybackStore((s) => s.rangeEnd);
  const stopPlayback = usePlaybackStore((s) => s.stopPlayback);
  const setPlaying = usePlaybackStore((s) => s.setPlaying);
  const setSpeed = usePlaybackStore((s) => s.setSpeed);

  const sliderRef = useRef<HTMLInputElement>(null);
  const timeDisplayRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) return;
    const update = () => {
      const t = playbackTimeState.currentTime;
      const span = rangeEnd - rangeStart;
      if (sliderRef.current && span > 0) {
        sliderRef.current.value = String(((t - rangeStart) / span) * 1000);
      }
      if (timeDisplayRef.current) {
        timeDisplayRef.current.textContent = formatEpoch(t);
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isActive, rangeStart, rangeEnd]);

  const handleScrub = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const fraction = Number(e.target.value) / 1000;
      const newTime = rangeStart + fraction * (rangeEnd - rangeStart);
      playbackTimeState.currentTime = newTime;
      playbackTimeState.version++;
      if (newTime < rangeEnd && usePlaybackStore.getState().autoStoppedAtCap) {
        usePlaybackStore.getState().setPlaying(true);
      }
    },
    [rangeStart, rangeEnd],
  );

  const stepSpeed = useCallback(
    (dir: -1 | 1) => {
      const idx = SPEED_VALUES.indexOf(speed);
      const next =
        SPEED_VALUES[Math.max(0, Math.min(SPEED_VALUES.length - 1, idx + dir))];
      setSpeed(next);
    },
    [speed, setSpeed],
  );

  const currentSpeedLabel =
    PLAYBACK_SPEEDS.find((s) => s.value === speed)?.label ?? `${speed}s/s`;

  if (!isActive) return null;

  return (
    <div className="pointer-events-auto w-full max-w-2xl mx-auto">
      <div className="space-y-2">
        <div
          ref={timeDisplayRef}
          className="text-center text-sm font-mono text-fg-secondary"
        >
          {formatEpoch(playbackTimeState.currentTime)}
        </div>

        <input
          ref={sliderRef}
          type="range"
          min={0}
          max={1000}
          defaultValue={0}
          onChange={handleScrub}
          className="w-full h-1.5 cursor-pointer accent-capsuleer"
          aria-label="Playback position"
        />

        <div className="flex items-center justify-center gap-2">
          <div className="flex items-center justify-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-fg-secondary hover:text-foreground cursor-pointer"
              onClick={() => stepSpeed(-1)}
              disabled={SPEED_VALUES.indexOf(speed) === 0}
              title="Decrease playback speed"
              aria-label="Decrease playback speed"
            >
              <ChevronLeft className="size-3.5" />
            </Button>

            <span className="text-xs font-mono text-fg-secondary w-20 text-center align-middle">
              {currentSpeedLabel}
            </span>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-1.5 text-fg-secondary hover:text-foreground cursor-pointer"
              onClick={() => stepSpeed(1)}
              disabled={SPEED_VALUES.indexOf(speed) === SPEED_VALUES.length - 1}
              title="Increase playback speed"
              aria-label="Increase playback speed"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="btn-glass h-8 w-8 p-0 cursor-pointer"
            onClick={() => setPlaying(!isPlaying)}
            title={isPlaying ? "Pause Playback" : "Start Playback"}
            aria-label={isPlaying ? "Pause Playback" : "Start Playback"}
          >
            {isPlaying ? (
              <Pause className="size-3.5" />
            ) : (
              <Play className="size-3.5" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="btn-glass h-8 w-8 p-0 cursor-pointer"
            onClick={stopPlayback}
            title="Exit Playback Mode"
            aria-label="Exit Playback Mode"
          >
            <Square className="size-3.5" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="btn-glass h-8 w-8 p-0 cursor-pointer"
            onClick={() => onShare?.()}
            title="Share this moment"
            aria-label="Share this moment"
          >
            <Share2 className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
});
