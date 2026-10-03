export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

export function secondsToDate(epoch: number): Date {
  return new Date(epoch * 1000);
}

export function formatRelativeTime(unixSec: number, now?: number): string {
  const diffSec = Math.max(0, Math.floor((now ?? Date.now()) / 1000 - unixSec));
  if (diffSec < 60) return diffSec <= 1 ? "just now" : `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)
    return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24)
    return diffHour === 1 ? "1 hour ago" : `${diffHour} hours ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return diffDay === 1 ? "1 day ago" : `${diffDay} days ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12)
    return diffMonth === 1 ? "1 month ago" : `${diffMonth} months ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return diffYear === 1 ? "1 year ago" : `${diffYear} years ago`;
}

export function formatAbsoluteUTC(unixSec?: number): string {
  if (!unixSec) return "Unknown";

  const d = secondsToDate(unixSec);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}
