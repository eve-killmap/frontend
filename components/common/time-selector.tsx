import React, { useState, useCallback, useMemo, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useKillStore } from "@/stores/kill-store";
import { ABSOLUTE_MIN_EPOCH } from "@/stores/time-range-store";
import { nowSeconds, secondsToDate } from "@/lib/formatting/time";
import { useTimeRange } from "@/hooks/use-time-range";
import { startOfDay, nextRangeSelection } from "@/lib/ui/calendar";
import { MonthCalendar } from "@/components/common/month-calendar";
import { TimeStepper } from "@/components/common/time-stepper";

const LAST_BUTTONS = [
  { text: "1h", value: 60 * 60 },
  { text: "6h", value: 60 * 60 * 6 },
  { text: "12h", value: 60 * 60 * 12 },
  { text: "24h", value: 60 * 60 * 24 },
  { text: "7d", value: 60 * 60 * 24 * 7 },
  { text: "1m", value: 60 * 60 * 24 * 30 },
  { text: "3m", value: 60 * 60 * 24 * 90 },
  { text: "6m", value: 60 * 60 * 24 * 180 },
  { text: "1y", value: 60 * 60 * 24 * 365 },
  { text: "3y", value: 60 * 60 * 24 * 365 * 3 },
];

const DAY_END = 23 * 3600 + 59 * 60;

function fmtDate(epoch: number): string {
  const d = secondsToDate(epoch);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

interface TimeSelectorProps {
  setTimeRange?: (range: [number, number] | null) => void;
  lastButtons?: { text: string; value: number }[];
  dayOnly?: boolean;
  requireData?: boolean;
}

export const TimeSelector = React.memo(function TimeSelector({
  setTimeRange: setTimeRangeProp,
  lastButtons = LAST_BUTTONS,
  dayOnly = false,
  requireData = true,
}: TimeSelectorProps = {}) {
  const data = useKillStore((s) => s.data);
  const hasData = requireData ? !!(data && data.count > 0) : true;

  const isStandalone = setTimeRangeProp !== undefined;
  const defaultEnd = useMemo(() => nowSeconds(), []);
  const persisted = useTimeRange(defaultEnd, ABSOLUTE_MIN_EPOCH);

  const [range, setRange] = useState<[number, number]>(() =>
    isStandalone ? [ABSOLUTE_MIN_EPOCH, defaultEnd] : persisted.range,
  );
  const [pending, setPending] = useState<number | null>(null);

  useEffect(() => {
    if (isStandalone) return;
    setRange(persisted.range);
  }, [isStandalone, persisted.range]);

  const applyRange = useCallback(
    (start: number, end: number) => {
      const r: [number, number] = [start, end];
      setRange(r);
      if (setTimeRangeProp) {
        const isFull = start <= ABSOLUTE_MIN_EPOCH && end >= defaultEnd;
        setTimeRangeProp(isFull ? null : r);
      } else {
        persisted.applyRange(start, end);
      }
    },
    [defaultEnd, setTimeRangeProp, persisted],
  );

  const startDay = startOfDay(range[0]);
  const endDay = startOfDay(range[1]);
  const startTOD = range[0] - startDay;
  const endTOD = range[1] - endDay;

  const handleDaySelect = useCallback(
    (day: number) => {
      const sel = nextRangeSelection(pending, day);
      setPending(sel.pending);
      let ns: number;
      let ne: number;
      if (dayOnly) {
        ns = sel.start;
        ne = sel.end + DAY_END;
      } else {
        ns = sel.start + startTOD;
        ne = sel.end + endTOD;
      }
      ns = Math.max(ABSOLUTE_MIN_EPOCH, ns);
      ne = Math.min(defaultEnd, Math.max(ne, ns));
      applyRange(ns, ne);
    },
    [pending, dayOnly, startTOD, endTOD, defaultEnd, applyRange],
  );

  const handleStartTime = useCallback(
    (hour: number, minute: number) => {
      const epoch = startDay + hour * 3600 + minute * 60;
      applyRange(
        Math.max(ABSOLUTE_MIN_EPOCH, Math.min(epoch, range[1])),
        range[1],
      );
    },
    [startDay, range, applyRange],
  );

  const handleEndTime = useCallback(
    (hour: number, minute: number) => {
      const epoch = endDay + hour * 3600 + minute * 60;
      applyRange(range[0], Math.min(defaultEnd, Math.max(epoch, range[0])));
    },
    [endDay, range, defaultEnd, applyRange],
  );

  const applyLast = useCallback(
    (value: number) => {
      setPending(null);
      applyRange(Math.max(ABSOLUTE_MIN_EPOCH, defaultEnd - value), defaultEnd);
    },
    [defaultEnd, applyRange],
  );

  const reset = useCallback(() => {
    setPending(null);
    applyRange(ABSOLUTE_MIN_EPOCH, defaultEnd);
  }, [applyRange, defaultEnd]);

  const startHour = Math.floor(startTOD / 3600);
  const startMinute = Math.floor((startTOD % 3600) / 60);
  const endHour = Math.floor(endTOD / 3600);
  const endMinute = Math.floor((endTOD % 3600) / 60);

  const isFullRange = range[0] <= ABSOLUTE_MIN_EPOCH && range[1] >= defaultEnd;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm text-fg-secondary">Time Range</Label>
        {!isFullRange && (
          <Button
            variant="link"
            size="sm"
            className="h-auto p-0 text-2xs text-fg-muted cursor-pointer"
            onClick={reset}
          >
            Reset
          </Button>
        )}
      </div>
      {!hasData ? (
        <p className="text-xs text-fg-faint">No kill data loaded</p>
      ) : (
        <div className="space-y-2">
          <MonthCalendar
            start={startDay}
            end={endDay}
            min={startOfDay(ABSOLUTE_MIN_EPOCH)}
            max={startOfDay(defaultEnd)}
            onSelect={handleDaySelect}
          />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xs text-fg-muted font-mono w-7">From</span>
              <span className="text-xs font-mono text-fg-secondary flex-1">
                {fmtDate(range[0])}
              </span>
              {!dayOnly && (
                <TimeStepper
                  hour={startHour}
                  minute={startMinute}
                  onChange={handleStartTime}
                />
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xs text-fg-muted font-mono w-7">To</span>
              <span className="text-xs font-mono text-fg-secondary flex-1">
                {fmtDate(range[1])}
              </span>
              {!dayOnly && (
                <TimeStepper
                  hour={endHour}
                  minute={endMinute}
                  onChange={handleEndTime}
                />
              )}
            </div>
          </div>
          {lastButtons.length > 0 && (
            <div className="flex justify-start items-center flex-wrap">
              <span className="text-xs text-fg-muted pr-1 select-none">
                Last:
              </span>
              {lastButtons.map((btn) => (
                <Button
                  key={btn.text}
                  variant="link"
                  size="sm"
                  className="h-auto p-1 text-xs text-fg-muted cursor-pointer"
                  onClick={() => applyLast(btn.value)}
                >
                  {btn.text}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});
