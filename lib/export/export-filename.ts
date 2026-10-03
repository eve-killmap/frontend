function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function stampFor(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}-${pad(d.getUTCMinutes())}Z`;
}

function dateFor(ms: number): string {
  return stampFor(ms).slice(0, 10);
}

export function mapPngFilename(mapType: string, ms: number): string {
  return `${mapType}-map-${stampFor(ms)}.png`;
}

export function systemPngFilename(slug: string, ms: number): string {
  return `${slug}-${stampFor(ms)}.png`;
}

export function killCsvFilename(slug: string, ms: number): string {
  return `${slug}-kills-${dateFor(ms)}.csv`;
}
