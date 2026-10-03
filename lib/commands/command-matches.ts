import type { Command } from "./types";

export function commandMatches(cmd: Command, query: string): boolean {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const hay = [cmd.label, ...(cmd.keywords ?? [])].join(" ").toLowerCase();
  return tokens.every((t) => hay.includes(t));
}
