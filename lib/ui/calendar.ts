export interface DayCell {
  day: number;
  epoch: number;
}

const DAY = 86400;

export function startOfDay(epoch: number): number {
  return Math.floor(epoch / DAY) * DAY;
}

export function monthOf(epoch: number): { year: number; month: number } {
  const d = new Date(epoch * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
}

export function dayEpoch(year: number, month: number, day: number): number {
  return Math.floor(Date.UTC(year, month, day) / 1000);
}

export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const idx = year * 12 + month + delta;
  return { year: Math.floor(idx / 12), month: ((idx % 12) + 12) % 12 };
}

function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

export function canGoPrev(
  year: number,
  month: number,
  minEpoch: number,
): boolean {
  const m = monthOf(minEpoch);
  return monthIndex(year, month) > monthIndex(m.year, m.month);
}

export function canGoNext(
  year: number,
  month: number,
  maxEpoch: number,
): boolean {
  const m = monthOf(maxEpoch);
  return monthIndex(year, month) < monthIndex(m.year, m.month);
}

export function buildMonthGrid(
  year: number,
  month: number,
): (DayCell | null)[] {
  const firstWeekday = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, epoch: dayEpoch(year, month, day) });
  }
  while (cells.length < 42) cells.push(null);
  return cells;
}

export function nextRangeSelection(
  pending: number | null,
  clickedDay: number,
): { start: number; end: number; pending: number | null } {
  if (pending === null) {
    return { start: clickedDay, end: clickedDay, pending: clickedDay };
  }
  return {
    start: Math.min(pending, clickedDay),
    end: Math.max(pending, clickedDay),
    pending: null,
  };
}

export function isInRange(day: number, start: number, end: number): boolean {
  return day >= start && day <= end;
}

export function isEndpoint(day: number, start: number, end: number): boolean {
  return day === start || day === end;
}
