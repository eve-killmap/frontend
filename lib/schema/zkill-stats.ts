import { ZkillSystemStats } from "./system-schema";

export function parseZkillSystemStats(raw: unknown): ZkillSystemStats | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw))
    return null;

  const obj = raw as Record<string, unknown>;

  const activepvp =
    obj.activepvp !== null &&
    typeof obj.activepvp === "object" &&
    !Array.isArray(obj.activepvp)
      ? obj.activepvp
      : {};
  const topLists = Array.isArray(obj.topLists) ? obj.topLists : [];

  return { ...obj, activepvp, topLists } as ZkillSystemStats;
}
