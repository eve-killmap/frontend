export interface TtlCacheOptions<K, V> {
  ttlMs: number;
  cap?: number;
  load: (key: K, signal?: AbortSignal) => Promise<V>;
  now?: () => number;
}

export interface TtlCache<K, V> {
  get(key: K, signal?: AbortSignal): Promise<V>;
  peek(key: K): V | null;
  invalidate(key: K): void;
  clear(): void;
}

interface Entry<V> {
  at: number;
  p: Promise<V>;
  settled: boolean;
  value: V | null;
  signal?: AbortSignal;
}

export function createTtlCache<K, V>({
  ttlMs,
  cap,
  load,
  now = Date.now,
}: TtlCacheOptions<K, V>): TtlCache<K, V> {
  const entries = new Map<K, Entry<V>>();
  const fresh = (e: Entry<V>, t: number) => t - e.at < ttlMs;

  return {
    get(key, signal) {
      const t = now();
      const hit = entries.get(key);
      if (hit) {
        const reusable = hit.settled
          ? fresh(hit, t)
          : !hit.signal || !hit.signal.aborted;
        if (reusable) return hit.p;
      }

      const entry = { at: t, settled: false, value: null, signal } as Entry<V>;
      entry.p = load(key, signal)
        .then((v) => {
          entry.settled = true;
          entry.value = v;
          return v;
        })
        .catch((e: unknown) => {
          if (entries.get(key) === entry) entries.delete(key);
          throw e;
        });
      entries.delete(key);
      entries.set(key, entry);
      if (cap !== undefined && entries.size > cap) {
        const oldest = entries.keys().next().value;
        if (oldest !== undefined) entries.delete(oldest);
      }
      return entry.p;
    },
    peek(key) {
      const hit = entries.get(key);
      return hit && hit.settled && fresh(hit, now()) ? hit.value : null;
    },
    invalidate(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
}
