export const SYSTEM_MATCH_MIN_CHARS = 2;
export const SYSTEM_MATCH_LIMIT = 8;

export function matchSystems(
  query: string,
  names: readonly string[],
  limit: number = SYSTEM_MATCH_LIMIT,
): string[] {
  const q = query.trim().toLowerCase();
  if (q.length < SYSTEM_MATCH_MIN_CHARS) return [];
  const prefix: string[] = [];
  const substring: string[] = [];
  for (const name of names) {
    const lower = name.toLowerCase();
    if (lower.startsWith(q)) {
      prefix.push(name);
      if (prefix.length >= limit) break;
    } else if (substring.length < limit && lower.includes(q)) {
      substring.push(name);
    }
  }
  return prefix.concat(substring).slice(0, limit);
}
