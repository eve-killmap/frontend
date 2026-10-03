import { useCallback, useMemo } from "react";
import { useTimeRangeStore, resolveTimeRange } from "@/stores/time-range-store";

export function useTimeRange(
  defaultEnd: number,
  min: number,
): {
  range: [number, number];
  applyRange: (start: number, end: number) => void;
} {
  const range = useTimeRangeStore((s) => s.range);
  const setRange = useTimeRangeStore((s) => s.setRange);

  const tuple = useMemo<[number, number]>(() => {
    if (!range) return [min, defaultEnd];
    const start = range.start ?? min;
    const end = range.end === "latest" ? defaultEnd : range.end;
    return [start, end];
  }, [range, defaultEnd, min]);

  const applyRange = useCallback(
    (start: number, end: number) => {
      if (start <= min && end >= defaultEnd) {
        setRange(null);
        return;
      }
      setRange({
        start: start <= min ? null : start,
        end: end >= defaultEnd ? "latest" : end,
      });
    },
    [defaultEnd, min, setRange],
  );

  return useMemo(() => ({ range: tuple, applyRange }), [tuple, applyRange]);
}

export function useResolvedTimeRange(): [number, number] | null {
  const range = useTimeRangeStore((s) => s.range);
  return useMemo(() => resolveTimeRange(range), [range]);
}
