import { RawKillsResponse } from "../schema/system-schema";

export interface FilteredKills {
  x: number[];
  y: number[];
  z: number[];
  killmailIds: number[];
  shipTypes: number[];
  killmailTimes: number[];
  count: number;
  earliestTime: number | null;
  latestTime: number | null;
}

export function countMissingPositions(source: RawKillsResponse): number {
  let count = 0;
  for (let i = 0; i < source.count; i++) {
    if (source.x[i] === 0 && source.y[i] === 0 && source.z[i] === 0) count++;
  }
  return count;
}

export interface RangeFilter {
  positions: Float64Array;
  rangeSq: number;
}

export function withinRangeFilter(
  x: number,
  y: number,
  z: number,
  rangeFilter: RangeFilter,
): boolean {
  const { positions, rangeSq } = rangeFilter;
  for (let j = 0; j < positions.length; j += 3) {
    const dx = x - positions[j],
      dy = y - positions[j + 1],
      dz = z - positions[j + 2];
    if (dx * dx + dy * dy + dz * dz <= rangeSq) return true;
  }
  return false;
}

export function killPassesViewFilters(
  kill: { v_ship_type_id: number; x: number; y: number; z: number },
  shipTypes: Set<number> | null,
  rangeFilter: RangeFilter | null,
): boolean {
  if (shipTypes && !shipTypes.has(kill.v_ship_type_id)) return false;
  if (rangeFilter && !withinRangeFilter(kill.x, kill.y, kill.z, rangeFilter))
    return false;
  return true;
}

export function filterKills(
  source: RawKillsResponse,
  timeRange: [number, number] | null,
  shipTypes: Set<number> | null,
  maxKills: number,
  rangeFilter?: RangeFilter | null,
  allowedIds?: Set<number> | null,
): FilteredKills {
  const { x, y, z, killmail_ids, killmail_times, ship_types, count } = source;

  if (rangeFilter && rangeFilter.positions.length === 0) {
    return {
      x: [],
      y: [],
      z: [],
      killmailIds: [],
      shipTypes: [],
      killmailTimes: [],
      count: 0,
      earliestTime: null,
      latestTime: null,
    };
  }

  if (
    !timeRange &&
    !shipTypes &&
    !rangeFilter &&
    !allowedIds &&
    count <= maxKills
  ) {
    return {
      x: x.slice(),
      y: y.slice(),
      z: z.slice(),
      killmailIds: killmail_ids.slice(),
      shipTypes: ship_types.slice(),
      killmailTimes: killmail_times.slice(),
      count,
      latestTime: count > 0 ? killmail_times[0] : null,
      earliestTime: count > 0 ? killmail_times[count - 1] : null,
    };
  }

  const passing: number[] = [];

  for (let i = 0; i < count; i++) {
    if (timeRange) {
      const t = killmail_times[i];
      if (t < timeRange[0] || t > timeRange[1]) continue;
    }
    if (shipTypes && !shipTypes.has(ship_types[i])) continue;
    if (allowedIds && !allowedIds.has(killmail_ids[i])) continue;
    if (rangeFilter && !withinRangeFilter(x[i], y[i], z[i], rangeFilter))
      continue;

    passing.push(i);

    if (passing.length >= maxKills) break;
  }

  const n = passing.length;

  const outX = new Array<number>(n);
  const outY = new Array<number>(n);
  const outZ = new Array<number>(n);
  const outIds = new Array<number>(n);
  const outShipTypes = new Array<number>(n);
  const outKillmailTimes = new Array<number>(n);

  for (let i = 0; i < n; i++) {
    const idx = passing[i];
    outX[i] = x[idx];
    outY[i] = y[idx];
    outZ[i] = z[idx];
    outIds[i] = killmail_ids[idx];
    outShipTypes[i] = ship_types[idx];
    outKillmailTimes[i] = killmail_times[idx];
  }

  const latestTime = n > 0 ? killmail_times[passing[0]] : null;
  const earliestTime = n > 0 ? killmail_times[passing[n - 1]] : null;

  return {
    x: outX,
    y: outY,
    z: outZ,
    killmailIds: outIds,
    shipTypes: outShipTypes,
    killmailTimes: outKillmailTimes,
    count: n,
    earliestTime,
    latestTime,
  };
}

export function maskKillmailTimes(
  source: RawKillsResponse,
  allowedIds: Set<number> | null,
  shipTypes: Set<number> | null,
  rangeFilter: RangeFilter | null,
): number[] {
  if (!allowedIds && !shipTypes && !rangeFilter) return source.killmail_times;
  if (rangeFilter && rangeFilter.positions.length === 0) return [];
  const out: number[] = [];
  for (let i = 0; i < source.count; i++) {
    if (allowedIds && !allowedIds.has(source.killmail_ids[i])) continue;
    if (shipTypes && !shipTypes.has(source.ship_types[i])) continue;
    if (
      rangeFilter &&
      !withinRangeFilter(source.x[i], source.y[i], source.z[i], rangeFilter)
    )
      continue;
    out.push(source.killmail_times[i]);
  }
  return out;
}
