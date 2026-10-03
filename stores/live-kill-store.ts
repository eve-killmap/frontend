import { create } from "zustand";
import { LiveKill } from "@/lib/schema/base-schema";

export const HOT_WINDOW_MS = 60 * 60 * 1000;
export const LIVE_KILL_CAP = 5000;
export const EXPIRY_TICK_MS = 15_000;

export interface LiveKillEntry {
  seq: number;
  kill: LiveKill;
  receivedAt: number;
}

export interface HotCounts {
  counts: Map<number, number>;
  max: number;
  tracked: number;
}

export function expireEntries(
  entries: LiveKillEntry[],
  now: number,
  windowMs: number = HOT_WINDOW_MS,
): LiveKillEntry[] {
  const cutoff = now - windowMs;
  let i = 0;
  while (i < entries.length && entries[i].receivedAt < cutoff) i++;
  return i === 0 ? entries : entries.slice(i);
}

export function entriesAfter(
  entries: LiveKillEntry[],
  seq: number,
): LiveKillEntry[] {
  let i = entries.length;
  while (i > 0 && entries[i - 1].seq > seq) i--;
  return i === entries.length ? [] : entries.slice(i);
}

export function killsForSystem(
  entries: LiveKillEntry[],
  solarSystemId: number,
): LiveKill[] {
  const out: LiveKill[] = [];
  for (let i = entries.length - 1; i >= 0; i--) {
    const k = entries[i].kill;
    if (k.solar_system_id === solarSystemId) out.push(k);
  }
  return out;
}

export function hotCounts(
  entries: LiveKillEntry[],
  now: number,
  mapSystemIds: ReadonlySet<number>,
  windowMs: number = HOT_WINDOW_MS,
): HotCounts {
  const cutoff = now - windowMs;
  const counts = new Map<number, number>();
  let max = 0;
  let tracked = 0;
  for (const e of entries) {
    if (e.receivedAt < cutoff) continue;
    const id = e.kill.solar_system_id;
    if (!mapSystemIds.has(id)) continue;
    tracked++;
    const c = (counts.get(id) ?? 0) + 1;
    counts.set(id, c);
    if (c > max) max = c;
  }
  return { counts, max, tracked };
}

interface LiveKillState {
  entries: LiveKillEntry[];
  connected: boolean;
  version: number;
  append: (kill: LiveKill, receivedAt?: number) => boolean;
  expire: (now?: number) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useLiveKillStore = create<LiveKillState>((set, get) => {
  const seen = new Set<number>();
  let nextSeq = 1;

  return {
    entries: [],
    connected: false,
    version: 0,

    append: (kill, receivedAt = Date.now()) => {
      if (seen.has(kill.killmail_id)) return false;
      seen.add(kill.killmail_id);
      const entry: LiveKillEntry = { seq: nextSeq++, kill, receivedAt };
      set((s) => {
        const next = [...s.entries, entry];
        if (next.length > LIVE_KILL_CAP) {
          const dropped = next.splice(0, next.length - LIVE_KILL_CAP);
          for (const d of dropped) seen.delete(d.kill.killmail_id);
        }
        return { entries: next, version: s.version + 1 };
      });
      return true;
    },

    expire: (now = Date.now()) => {
      const { entries } = get();
      const kept = expireEntries(entries, now);
      if (kept === entries) return;
      const removed = entries.length - kept.length;
      for (let i = 0; i < removed; i++)
        seen.delete(entries[i].kill.killmail_id);
      set((s) => ({ entries: kept, version: s.version + 1 }));
    },

    setConnected: (connected) => set({ connected }),

    reset: () => {
      seen.clear();
      nextSeq = 1;
      set({ entries: [], connected: false, version: 0 });
    },
  };
});
