import { describe, it, expect } from "vitest";
import {
  startOfDay,
  monthOf,
  dayEpoch,
  addMonths,
  canGoPrev,
  canGoNext,
  buildMonthGrid,
  nextRangeSelection,
  isInRange,
  isEndpoint,
} from "./calendar";

describe("startOfDay", () => {
  it("floors an epoch to UTC midnight", () => {
    const noon = dayEpoch(2015, 10, 3) + 12 * 3600 + 34 * 60;
    expect(startOfDay(noon)).toBe(dayEpoch(2015, 10, 3));
  });
});

describe("monthOf", () => {
  it("returns the UTC year and 0-indexed month", () => {
    expect(monthOf(dayEpoch(2016, 0, 15))).toEqual({ year: 2016, month: 0 });
  });
});

describe("addMonths", () => {
  it("rolls forward across a year boundary", () => {
    expect(addMonths(2015, 11, 1)).toEqual({ year: 2016, month: 0 });
  });
  it("rolls backward across a year boundary", () => {
    expect(addMonths(2016, 0, -1)).toEqual({ year: 2015, month: 11 });
  });
});

describe("canGoPrev / canGoNext", () => {
  const min = dayEpoch(2015, 10, 1);
  const max = dayEpoch(2016, 0, 15);
  it("blocks paging before the min month", () => {
    expect(canGoPrev(2015, 10, min)).toBe(false);
    expect(canGoPrev(2015, 11, min)).toBe(true);
  });
  it("blocks paging past the max month", () => {
    expect(canGoNext(2016, 0, max)).toBe(false);
    expect(canGoNext(2015, 11, max)).toBe(true);
  });
});

describe("buildMonthGrid", () => {
  it("pads leading blanks for the first weekday and lists every day", () => {
    const cells = buildMonthGrid(2015, 11);
    expect(cells[0]).toBeNull();
    expect(cells[1]).toBeNull();
    expect(cells[2]).toEqual({ day: 1, epoch: dayEpoch(2015, 11, 1) });
    expect(cells[32]).toEqual({ day: 31, epoch: dayEpoch(2015, 11, 31) });
  });

  it("has no leading blanks when the month starts on Sunday", () => {
    const cells = buildMonthGrid(2015, 10);
    expect(cells[0]).toEqual({ day: 1, epoch: dayEpoch(2015, 10, 1) });
    expect(cells[29]).toEqual({ day: 30, epoch: dayEpoch(2015, 10, 30) });
  });

  it("always pads to a fixed 6-row (42-cell) grid", () => {
    expect(buildMonthGrid(2015, 11).length).toBe(42);
    expect(buildMonthGrid(2015, 10).length).toBe(42);
    expect(buildMonthGrid(2015, 1).length).toBe(42);
    expect(buildMonthGrid(2015, 1)[28]).toBeNull();
  });
});

describe("nextRangeSelection", () => {
  const d1 = dayEpoch(2015, 10, 5);
  const d2 = dayEpoch(2015, 10, 12);
  it("first click anchors both ends and stays pending", () => {
    expect(nextRangeSelection(null, d1)).toEqual({
      start: d1,
      end: d1,
      pending: d1,
    });
  });
  it("second click completes the range and clears pending", () => {
    expect(nextRangeSelection(d1, d2)).toEqual({
      start: d1,
      end: d2,
      pending: null,
    });
  });
  it("orders a reversed second click", () => {
    expect(nextRangeSelection(d2, d1)).toEqual({
      start: d1,
      end: d2,
      pending: null,
    });
  });
});

describe("isInRange / isEndpoint", () => {
  const a = dayEpoch(2015, 10, 5);
  const b = dayEpoch(2015, 10, 8);
  it("detects days within the inclusive range", () => {
    expect(isInRange(dayEpoch(2015, 10, 6), a, b)).toBe(true);
    expect(isInRange(dayEpoch(2015, 10, 9), a, b)).toBe(false);
  });
  it("detects the endpoints", () => {
    expect(isEndpoint(a, a, b)).toBe(true);
    expect(isEndpoint(b, a, b)).toBe(true);
    expect(isEndpoint(dayEpoch(2015, 10, 6), a, b)).toBe(false);
  });
});
