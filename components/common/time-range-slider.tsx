import React, {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useId,
  useRef,
} from "react";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { secondsToDate } from "@/lib/formatting/time";
import { densityPaths } from "@/lib/ui/density";
import { DensitySkeleton } from "@/components/common/density-skeleton";

function DensityPlot({
  counts,
  min,
  max,
  selStart,
  selEnd,
}: {
  counts: ArrayLike<number>;
  min: number;
  max: number;
  selStart: number;
  selEnd: number;
}) {
  const rawId = useId();
  const clipId = `dc${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  const N = counts.length;

  const paths = useMemo(() => densityPaths(counts, 40), [counts]);

  if (!paths) return <div style={{ height: 40 }} />;

  const span = max - min;
  const selX = (((selStart - min) / span) * N).toFixed(2);
  const selW = Math.max(0, ((selEnd - selStart) / span) * N).toFixed(2);

  return (
    <svg
      viewBox={`0 0 ${N} 40`}
      preserveAspectRatio="none"
      width="100%"
      height="40"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={selX} y={0} width={selW} height={40} />
        </clipPath>
      </defs>
      <path d={paths.areaPath} fillOpacity={0.12} className="fill-capsuleer" />
      <g clipPath={`url(#${clipId})`}>
        <path
          d={paths.areaPath}
          fillOpacity={0.32}
          className="fill-capsuleer"
        />
        <path
          d={paths.linePath}
          fill="none"
          strokeOpacity={0.85}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          className="stroke-capsuleer"
        />
      </g>
    </svg>
  );
}

function TimelineTicks({ min, max }: { min: number; max: number }) {
  const ticks = useMemo(() => {
    const span = max - min;
    const items: { pct: number; label: string; major: boolean }[] = [];
    const startYear = secondsToDate(min).getUTCFullYear();
    const endYear = secondsToDate(max).getUTCFullYear() + 1;
    for (let y = startYear; y <= endYear; y++) {
      const epoch = Date.UTC(y, 0, 1) / 1000;
      if (epoch < min || epoch > max) continue;
      items.push({
        pct: ((epoch - min) / span) * 100,
        label: String(y),
        major: true,
      });
      const midEpoch = Date.UTC(y, 6, 1) / 1000;
      if (midEpoch > min && midEpoch < max)
        items.push({
          pct: ((midEpoch - min) / span) * 100,
          label: "",
          major: false,
        });
    }
    return items;
  }, [min, max]);

  return (
    <div className="relative mt-1" style={{ height: 20, overflow: "visible" }}>
      {ticks.map(({ pct, label, major }, i) => (
        <div
          key={i}
          className="absolute -translate-x-1/2 flex flex-col items-center"
          style={{ left: `${pct}%` }}
        >
          <div className={`w-px bg-capsuleer/40 ${major ? "h-2" : "h-1"}`} />
          {major && (
            <span className="text-3xs text-capsuleer/50 select-none whitespace-nowrap leading-tight font-mono">
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function defaultFormatLabel(epoch: number): string {
  const d = secondsToDate(epoch);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

const DAY_SECONDS = 86400;
const QUICK_RANGES: { label: string; seconds: number }[] = [
  { label: "1D", seconds: DAY_SECONDS },
  { label: "7D", seconds: 7 * DAY_SECONDS },
  { label: "1M", seconds: 30 * DAY_SECONDS },
  { label: "3M", seconds: 90 * DAY_SECONDS },
  { label: "6M", seconds: 180 * DAY_SECONDS },
  { label: "1Y", seconds: 365 * DAY_SECONDS },
  { label: "3Y", seconds: 1095 * DAY_SECONDS },
];

const SUB_DAY_RANGES: { label: string; seconds: number }[] = [
  { label: "1H", seconds: 3600 },
  { label: "6H", seconds: 6 * 3600 },
  { label: "12H", seconds: 12 * 3600 },
];

export const TimeRangeSlider = React.memo(function TimeRangeSlider({
  min,
  max,
  step,
  counts,
  loading,
  value,
  onChange,
  expanded,
  onExpandedChange,
  formatLabel = defaultFormatLabel,
  precisionEditor,
  showSubDayRanges,
  note,
  onControlsInsetChange,
}: {
  min: number;
  max: number;
  step: number;
  counts: ArrayLike<number> | null;
  loading: boolean;
  value: [number, number];
  onChange: (start: number, end: number) => void;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  formatLabel?: (epoch: number) => string;
  precisionEditor?: React.ReactNode;
  showSubDayRanges?: boolean;
  note?: string;
  onControlsInsetChange?: (inset: number | null) => void;
}) {
  const [activeThumb, setActiveThumb] = useState<0 | 1 | null>(null);
  const hideThumbRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sliderWrapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const controls = controlsRef.current;
    if (!onControlsInsetChange || !root || !controls) return;
    const report = () =>
      onControlsInsetChange(
        root.getBoundingClientRect().bottom -
          controls.getBoundingClientRect().bottom,
      );
    report();
    const observer = new ResizeObserver(report);
    observer.observe(root);
    return () => {
      observer.disconnect();
      onControlsInsetChange(null);
    };
  }, [onControlsInsetChange]);
  const scrubStartRef = useRef<{
    clientX: number;
    start: number;
    end: number;
  } | null>(null);

  const scheduleHideThumb = useCallback(() => {
    if (hideThumbRef.current) clearTimeout(hideThumbRef.current);
    hideThumbRef.current = setTimeout(() => setActiveThumb(null), 500);
  }, []);

  useEffect(() => {
    if (activeThumb === null) return;
    window.addEventListener("pointerup", scheduleHideThumb);
    window.addEventListener("pointercancel", scheduleHideThumb);
    return () => {
      window.removeEventListener("pointerup", scheduleHideThumb);
      window.removeEventListener("pointercancel", scheduleHideThumb);
    };
  }, [activeThumb, scheduleHideThumb]);

  const handleSliderChange = useCallback(
    (v: number[]) => {
      if (hideThumbRef.current) {
        clearTimeout(hideThumbRef.current);
        hideThumbRef.current = null;
      }
      if (v[0] !== value[0]) setActiveThumb(0);
      else if (v[1] !== value[1]) setActiveThumb(1);
      onChange(v[0], v[1]);
    },
    [onChange, value],
  );

  const handleScrubDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = sliderWrapRef.current;
      if (!el) return;
      if (value[0] <= min && value[1] >= max) return;
      const rect = el.getBoundingClientRect();
      const totalSpan = max - min;
      const v = min + ((e.clientX - rect.left) / rect.width) * totalSpan;
      const thumbBuffer = (10 / rect.width) * totalSpan;
      if (v <= value[0] + thumbBuffer || v >= value[1] - thumbBuffer) return;
      e.stopPropagation();
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "ew-resize";
      scrubStartRef.current = {
        clientX: e.clientX,
        start: value[0],
        end: value[1],
      };
    },
    [value, min, max],
  );

  const handleScrubMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = sliderWrapRef.current;
      if (!el) return;
      if (scrubStartRef.current) {
        const rect = el.getBoundingClientRect();
        const totalSpan = max - min;
        const delta =
          Math.round(
            (((e.clientX - scrubStartRef.current.clientX) / rect.width) *
              totalSpan) /
              step,
          ) * step;
        const span = scrubStartRef.current.end - scrubStartRef.current.start;
        let newStart = scrubStartRef.current.start + delta;
        let newEnd = scrubStartRef.current.end + delta;
        if (newStart < min) {
          newStart = min;
          newEnd = min + span;
        } else if (newEnd > max) {
          newEnd = max;
          newStart = max - span;
        }
        onChange(newStart, newEnd);
        el.style.cursor = "ew-resize";
        return;
      }
      const rect = el.getBoundingClientRect();
      const totalSpan = max - min;
      const v = min + ((e.clientX - rect.left) / rect.width) * totalSpan;
      const canScrub = !(value[0] <= min && value[1] >= max);
      el.style.cursor =
        canScrub && v > value[0] && v < value[1] ? "ew-resize" : "";
    },
    [value, min, max, step, onChange],
  );

  const handleScrubUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!scrubStartRef.current) return;
      scrubStartRef.current = null;
      const el = sliderWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalSpan = max - min;
      const v = min + ((e.clientX - rect.left) / rect.width) * totalSpan;
      const canScrub = !(value[0] <= min && value[1] >= max);
      el.style.cursor =
        canScrub && v > value[0] && v < value[1] ? "ew-resize" : "";
    },
    [value, min, max],
  );

  const isFullRange = value[0] <= min && value[1] >= max;

  const labelFrac =
    activeThumb === null ? 0 : (value[activeThumb] - min) / (max - min);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none flex flex-col items-center gap-1 pb-3 overflow-x-clip"
    >
      <div className="w-[96%] pointer-events-none flex items-end justify-end">
        <div
          ref={controlsRef}
          className="relative flex items-end gap-2 pointer-events-auto"
        >
          {expanded && note ? (
            <span className="absolute bottom-full right-0 mb-1 text-3xs text-capsuleer/50 select-none whitespace-nowrap leading-tight font-mono pointer-events-none">
              {note}
            </span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            className={`btn-glass text-xs ${isFullRange ? "hidden" : ""}`}
            onClick={() => onChange(min, max)}
          >
            <RotateCcw />
            Reset Timeline
          </Button>
          <div className="flex items-center">
            <span className="text-sm text-foreground/70 select-none pr-1">
              Last:
            </span>
            {[...(showSubDayRanges ? SUB_DAY_RANGES : []), ...QUICK_RANGES].map(
              (r) => (
                <Button
                  key={r.label}
                  variant="outline"
                  size="sm"
                  className="btn-glass text-xs"
                  onClick={() => onChange(Math.max(min, max - r.seconds), max)}
                >
                  {r.label}
                </Button>
              ),
            )}
          </div>
          {precisionEditor}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExpandedChange(!expanded)}
            className="btn-glass text-xs"
            title={expanded ? "Collapse timeline" : "Show timeline"}
            aria-label={expanded ? "Collapse timeline" : "Show timeline"}
          >
            <ChevronDown
              className={`transition-transform ${expanded ? "" : "rotate-180"}`}
            />
            Timeline
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="w-[96%] pointer-events-none">
          <div className="px-2">
            {counts ? (
              <DensityPlot
                counts={counts}
                min={min}
                max={max}
                selStart={value[0]}
                selEnd={value[1]}
              />
            ) : loading ? (
              <DensitySkeleton height={40} />
            ) : (
              <div style={{ height: 40 }} />
            )}
          </div>
          <div className="h-2" />
          <div
            ref={sliderWrapRef}
            className="relative pointer-events-auto"
            onPointerDownCapture={handleScrubDown}
            onPointerMove={handleScrubMove}
            onPointerUp={handleScrubUp}
            onPointerLeave={() => {
              if (!scrubStartRef.current && sliderWrapRef.current)
                sliderWrapRef.current.style.cursor = "";
            }}
          >
            {activeThumb !== null && (
              <div
                className="absolute top-full z-hud pointer-events-none pt-3"
                style={{ left: `calc(${labelFrac} * (100% - 16px) + 8px)` }}
              >
                <div className="-translate-x-1/2 bg-panel border border-border text-fg-secondary text-xs px-1.5 py-0.5 whitespace-nowrap font-mono">
                  {formatLabel(value[activeThumb])}
                </div>
              </div>
            )}
            <Slider
              min={min}
              max={max}
              step={step}
              value={value}
              onValueChange={handleSliderChange}
              onValueCommit={scheduleHideThumb}
              className=""
            />
          </div>
          <div className="px-2">
            <TimelineTicks min={min} max={max} />
          </div>
        </div>
      )}
    </div>
  );
});
