import React, { useMemo } from "react";
import { useKillStore } from "@/stores/kill-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { ABSOLUTE_MIN_EPOCH } from "@/stores/time-range-store";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { nowSeconds } from "@/lib/formatting/time";
import { maskKillmailTimes } from "@/lib/kill/kill-filter";
import { useTimeRange } from "@/hooks/use-time-range";
import { binTimes } from "@/lib/ui/density";
import { TimeRangeSlider } from "@/components/common/time-range-slider";
import { TimeRangePrecisionPopover } from "@/components/common/time-range-precision-popover";

const N_BINS = 300;

export const TimeRangeBar = React.memo(function TimeRangeBar({
  expanded,
  onExpandedChange,
  onControlsInsetChange,
}: {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onControlsInsetChange: (inset: number | null) => void;
}) {
  const isPlaybackActive = usePlaybackStore((s) => s.isActive);
  const data = useKillStore((s) => s.data);
  const allowedIds = useKillStore((s) => s.allowedIds);
  const rangeFilter = useKillStore((s) => s.rangeFilter);
  const shipTypes = useSystemSettingsStore((s) => s.shipTypes);
  const isLoading = useKillStore((s) => s.isLoading);
  const hasData = !!(data && data.count > 0);

  const defaultEnd = useMemo(() => nowSeconds(), []);

  const plotTimes = useMemo(
    () =>
      data ? maskKillmailTimes(data, allowedIds, shipTypes, rangeFilter) : null,
    [data, allowedIds, shipTypes, rangeFilter],
  );

  const counts = useMemo(
    () =>
      hasData && plotTimes
        ? binTimes(plotTimes, ABSOLUTE_MIN_EPOCH, defaultEnd, N_BINS)
        : null,
    [hasData, plotTimes, defaultEnd],
  );

  const { range, applyRange } = useTimeRange(defaultEnd, ABSOLUTE_MIN_EPOCH);

  if (isPlaybackActive) return null;

  if (!isLoading && data !== null && data.count === 0)
    return (
      <div className="pointer-events-none flex justify-center pb-3">
        <div className="border border-border bg-panel px-2 py-2 flex items-center">
          <span className="font-mono text-2xs text-fg-subtle uppercase tracking-[2px] leading-none">
            This system has no kills.
          </span>
        </div>
      </div>
    );

  return (
    <TimeRangeSlider
      min={ABSOLUTE_MIN_EPOCH}
      max={defaultEnd}
      step={3600}
      counts={counts}
      loading={isLoading}
      value={range}
      onChange={applyRange}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      onControlsInsetChange={onControlsInsetChange}
      precisionEditor={<TimeRangePrecisionPopover />}
      showSubDayRanges
    />
  );
});
