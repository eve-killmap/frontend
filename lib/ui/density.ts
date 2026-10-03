export function binTimes(
  times: number[],
  min: number,
  max: number,
  n: number,
): Int32Array {
  const counts = new Int32Array(n);
  const span = max - min;
  if (span <= 0) return counts;
  for (let i = 0; i < times.length; i++) {
    const bin = Math.min(
      n - 1,
      Math.max(0, Math.floor(((times[i] - min) / span) * n)),
    );
    counts[bin]++;
  }
  return counts;
}

export function gaussianSmooth(
  counts: ArrayLike<number>,
  sigma: number,
): Float64Array {
  const N = counts.length;
  const result = new Float64Array(N);
  const radius = Math.ceil(sigma * 3);
  for (let i = 0; i < N; i++) {
    let sum = 0,
      wt = 0;
    for (let k = -radius; k <= radius; k++) {
      const j = i + k;
      if (j >= 0 && j < N) {
        const w = Math.exp(-0.5 * (k / sigma) ** 2);
        sum += counts[j] * w;
        wt += w;
      }
    }
    result[i] = wt > 0 ? sum / wt : 0;
  }
  return result;
}

export function monotoneCubicPath(pts: Float64Array): string {
  const N = pts.length;
  if (N < 2) return "";
  const x = (i: number) => i + 0.5;
  const s = new Float64Array(N - 1);
  for (let i = 0; i < N - 1; i++) s[i] = pts[i + 1] - pts[i];
  const m = new Float64Array(N);
  m[0] = s[0];
  m[N - 1] = s[N - 2];
  for (let i = 1; i < N - 1; i++) {
    if (s[i - 1] * s[i] <= 0) {
      m[i] = 0;
    } else {
      m[i] = (s[i - 1] + s[i]) / 2;
      const limit = Math.min(2 * Math.abs(s[i - 1]), 2 * Math.abs(s[i]));
      if (Math.abs(m[i]) > limit) m[i] = limit * Math.sign(m[i]);
    }
  }
  const parts = [`M ${x(0).toFixed(2)} ${pts[0].toFixed(2)}`];
  for (let i = 0; i < N - 1; i++) {
    const cp1x = (x(i) + 1 / 3).toFixed(2);
    const cp1y = (pts[i] + m[i] / 3).toFixed(2);
    const cp2x = (x(i + 1) - 1 / 3).toFixed(2);
    const cp2y = (pts[i + 1] - m[i + 1] / 3).toFixed(2);
    parts.push(
      `C ${cp1x} ${cp1y},${cp2x} ${cp2y},${x(i + 1).toFixed(2)} ${pts[i + 1].toFixed(2)}`,
    );
  }
  return parts.join(" ");
}

export interface DensityPaths {
  linePath: string;
  areaPath: string;
}

export function densityPaths(
  counts: ArrayLike<number>,
  height: number,
): DensityPaths | null {
  const N = counts.length;
  if (N < 2) return null;
  const smoothed = gaussianSmooth(counts, 0.5);
  let maxVal = 0;
  let minVal = Infinity;
  for (let i = 0; i < N; i++) {
    if (smoothed[i] > maxVal) maxVal = smoothed[i];
    if (counts[i] < minVal) minVal = counts[i];
  }
  if (maxVal === 0) return null;
  const range = maxVal - minVal;
  const yVals = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const norm = range > 0 ? (smoothed[i] - minVal) / range : 0;
    yVals[i] = height - 2 - norm * (height - 4);
  }
  const linePath = monotoneCubicPath(yVals);
  const areaPath = `${linePath} L ${(N - 0.5).toFixed(2)} ${height} L 0.5 ${height} Z`;
  return { linePath, areaPath };
}
