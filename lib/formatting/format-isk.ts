export function formatIsk(value: number | undefined): string {
  if (!value) return "0";
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}t`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}b`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}m`;
  if (value >= 1e5) return `${(value / 1e3).toFixed(2)}k`;
  return value.toLocaleString();
}
