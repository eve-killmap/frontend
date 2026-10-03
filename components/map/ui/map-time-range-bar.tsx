import { useMemo } from "react";
import { useMapStore } from "@/stores/map/map-store";
import { useFilterConditions } from "@/stores/filter-store";
import { ABSOLUTE_MIN_EPOCH } from "@/stores/time-range-store";
import { formatAbsoluteUTC, nowSeconds } from "@/lib/formatting/time";
import { epochToUtcDate } from "@/lib/map/system-kills-query";
import { useTimeRange } from "@/hooks/use-time-range";
import { useGlobalKills } from "@/hooks/map/use-global-kills";
import { TimeRangeSlider } from "@/components/common/time-range-slider";
import { TimeRangePrecisionPopover } from "@/components/common/time-range-precision-popover";

export function MapTimeRangeBar({
  mapType,
  expanded,
  onExpandedChange,
  onControlsInsetChange,
}: {
  mapType: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onControlsInsetChange: (inset: number | null) => void;
}) {
  const colorMode = useMapStore((s) => s.colorMode);
  const conditions = useFilterConditions();
  const show = colorMode === "activity" || conditions.length > 0;

  const defaultEnd = useMemo(() => nowSeconds(), []);
  const { range, applyRange } = useTimeRange(defaultEnd, ABSOLUTE_MIN_EPOCH);
  const { counts, computedAt, loading } = useGlobalKills(
    mapType,
    conditions,
    show,
  );

  if (!show) return null;

  return (
    <TimeRangeSlider
      min={ABSOLUTE_MIN_EPOCH}
      max={defaultEnd}
      step={86400}
      counts={counts}
      loading={loading}
      value={range}
      onChange={applyRange}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
      onControlsInsetChange={onControlsInsetChange}
      formatLabel={epochToUtcDate}
      precisionEditor={<TimeRangePrecisionPopover dayOnly />}
      note={
        computedAt != null
          ? `Data current as of ${formatAbsoluteUTC(computedAt)} UTC`
          : undefined
      }
    />
  );
}
