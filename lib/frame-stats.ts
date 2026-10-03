export interface RendererInfoLike {
  render: { calls: number; triangles: number; points: number; lines: number };
  memory: { geometries: number; textures: number };
  programs: unknown[] | null;
}

const BUFFER_SIZE = 60;
const fpsBuffer = new Float32Array(BUFFER_SIZE);
let bufferHead = 0;
let bufferFilled = 0;
let secondStartMs = -1;
let lastTickMs = -1;
let framesThisSecond = 0;
let maxDeltaThisSecond = 0;

export const frameStats = {
  fps1s: 0,
  fps30s: 0,
  fps1m: 0,
  frameMsLast: 0,
  frameMsMax1s: 0,
  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  heapUsedMb: null as number | null,
  heapTotalMb: null as number | null,
};

type MemoryPerformance = Performance & {
  memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
};

function readHeap(): void {
  const mem =
    typeof performance === "undefined"
      ? undefined
      : (performance as MemoryPerformance).memory;
  if (!mem) {
    frameStats.heapUsedMb = null;
    frameStats.heapTotalMb = null;
    return;
  }
  frameStats.heapUsedMb = mem.usedJSHeapSize / 1048576;
  frameStats.heapTotalMb = mem.totalJSHeapSize / 1048576;
}

function average(count: number): number {
  if (count <= 0) return 0;
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const idx =
      (((bufferHead - 1 - i) % BUFFER_SIZE) + BUFFER_SIZE) % BUFFER_SIZE;
    sum += fpsBuffer[idx];
  }
  return Math.round(sum / count);
}

function flushSecond(): void {
  fpsBuffer[bufferHead % BUFFER_SIZE] = framesThisSecond;
  bufferHead++;
  bufferFilled = Math.min(bufferFilled + 1, BUFFER_SIZE);
  framesThisSecond = 0;
  frameStats.fps1s = average(Math.min(bufferFilled, 1));
  frameStats.fps30s = average(Math.min(bufferFilled, 30));
  frameStats.fps1m = average(Math.min(bufferFilled, 60));
  frameStats.frameMsMax1s = maxDeltaThisSecond;
  maxDeltaThisSecond = 0;
  readHeap();
}

export function frameStatsTick(
  nowMs: number,
  info: RendererInfoLike | null,
): void {
  if (secondStartMs < 0) secondStartMs = nowMs;
  if (lastTickMs >= 0) {
    const delta = nowMs - lastTickMs;
    frameStats.frameMsLast = delta;
    if (delta > maxDeltaThisSecond) maxDeltaThisSecond = delta;
  }
  lastTickMs = nowMs;

  if (nowMs - secondStartMs >= 1000) {
    flushSecond();
    secondStartMs += 1000;
    if (nowMs - secondStartMs >= 1000) secondStartMs = nowMs;
  }
  framesThisSecond++;

  if (info) {
    frameStats.drawCalls = info.render.calls;
    frameStats.triangles = info.render.triangles;
    frameStats.points = info.render.points;
    frameStats.lines = info.render.lines;
    frameStats.geometries = info.memory.geometries;
    frameStats.textures = info.memory.textures;
    frameStats.programs = info.programs?.length ?? 0;
  }
}

export function frameStatsReset(): void {
  fpsBuffer.fill(0);
  bufferHead = 0;
  bufferFilled = 0;
  secondStartMs = -1;
  lastTickMs = -1;
  framesThisSecond = 0;
  maxDeltaThisSecond = 0;
  frameStats.fps1s = 0;
  frameStats.fps30s = 0;
  frameStats.fps1m = 0;
  frameStats.frameMsLast = 0;
  frameStats.frameMsMax1s = 0;
  frameStats.drawCalls = 0;
  frameStats.triangles = 0;
  frameStats.points = 0;
  frameStats.lines = 0;
  frameStats.geometries = 0;
  frameStats.textures = 0;
  frameStats.programs = 0;
  frameStats.heapUsedMb = null;
  frameStats.heapTotalMb = null;
}
