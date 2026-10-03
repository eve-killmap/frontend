import { LiveKillSchema } from "@/lib/schema/base-schema";
import { useLiveKillStore } from "@/stores/live-kill-store";

export function ingestLiveKillFrame(raw: string, now = Date.now()): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return false;
  }
  const result = LiveKillSchema.safeParse(parsed);
  if (!result.success) return false;
  return useLiveKillStore.getState().append(result.data, now);
}
