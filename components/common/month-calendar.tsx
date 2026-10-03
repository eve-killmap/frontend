import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  buildMonthGrid,
  monthOf,
  addMonths,
  canGoPrev,
  canGoNext,
  isInRange,
  isEndpoint,
} from "@/lib/ui/calendar";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function MonthCalendar({
  start,
  end,
  min,
  max,
  onSelect,
}: {
  start: number;
  end: number;
  min: number;
  max: number;
  onSelect: (day: number) => void;
}) {
  const [view, setView] = useState(() => monthOf(end));
  const [picking, setPicking] = useState(false);

  const minMonth = monthOf(min);
  const maxMonth = monthOf(max);

  const cells = buildMonthGrid(view.year, view.month);
  const prevOk = canGoPrev(view.year, view.month, min);
  const nextOk = canGoNext(view.year, view.month, max);

  const years: number[] = [];
  for (let y = minMonth.year; y <= maxMonth.year; y++) years.push(y);

  const selectYear = (year: number) => {
    let month = view.month;
    if (year === minMonth.year && month < minMonth.month)
      month = minMonth.month;
    if (year === maxMonth.year && month > maxMonth.month)
      month = maxMonth.month;
    setView({ year, month });
    setPicking(false);
  };

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-1 h-6">
        {picking ? (
          <button
            type="button"
            onClick={() => setPicking(false)}
            className="mx-auto text-xs font-mono text-fg-secondary hover:text-capsuleer cursor-pointer"
          >
            Select year
          </button>
        ) : (
          <>
            <button
              type="button"
              aria-label="Previous month"
              disabled={!prevOk}
              onClick={() => setView((v) => addMonths(v.year, v.month, -1))}
              className="text-fg-muted hover:text-capsuleer disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="text-xs font-mono text-fg-secondary hover:text-capsuleer cursor-pointer"
            >
              {MONTHS[view.month]} {view.year}
            </button>
            <button
              type="button"
              aria-label="Next month"
              disabled={!nextOk}
              onClick={() => setView((v) => addMonths(v.year, v.month, 1))}
              className="text-fg-muted hover:text-capsuleer disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>
      <div className="min-h-48">
        {picking ? (
          <div className="grid grid-cols-3 gap-1">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => selectYear(y)}
                className={`h-8 text-xs font-mono cursor-pointer transition-colors ${
                  y === view.year
                    ? "bg-capsuleer text-black"
                    : "text-fg-secondary hover:bg-panel-elevated"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-3xs text-fg-muted font-mono py-0.5">
                {w}
              </span>
            ))}
            {cells.map((cell, i) => {
              if (!cell) return <span key={i} />;
              const disabled = cell.epoch < min || cell.epoch > max;
              const endpoint = isEndpoint(cell.epoch, start, end);
              const inRange = isInRange(cell.epoch, start, end);
              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  aria-label={new Date(cell.epoch * 1000)
                    .toISOString()
                    .slice(0, 10)}
                  onClick={() => onSelect(cell.epoch)}
                  className={`h-7 text-xs font-mono cursor-pointer transition-colors ${
                    disabled
                      ? "text-fg-faint pointer-events-none"
                      : endpoint
                        ? "bg-capsuleer text-black"
                        : inRange
                          ? "bg-capsuleer/20 text-foreground"
                          : "text-fg-secondary hover:bg-panel-elevated"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
