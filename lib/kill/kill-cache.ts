import { RawKillsResponse } from "../schema/system-schema";

const DB_NAME = "eve-killmap";
const DB_VERSION = 3;
const STORE_NAME = "kills";

interface CachedEntry {
  systemId: number;
  compressed: ArrayBuffer;
  freshTo: number;
}

export function parseFreshTo(header: string | null): number | null {
  if (header === null) return null;
  const trimmed = header.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (db.objectStoreNames.contains(STORE_NAME))
        db.deleteObjectStore(STORE_NAME);
      db.createObjectStore(STORE_NAME, { keyPath: "systemId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = openDB()
      .then((db) => {
        db.onclose = () => {
          dbPromise = null;
        };
        return db;
      })
      .catch((e) => {
        dbPromise = null;
        throw e;
      });
  }
  return dbPromise;
}

async function compress(data: RawKillsResponse): Promise<ArrayBuffer> {
  const blob = new Blob([JSON.stringify(data)]);
  const stream = blob.stream().pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).arrayBuffer();
}

async function decompress(buffer: ArrayBuffer): Promise<RawKillsResponse> {
  const blob = new Blob([buffer]);
  const stream = blob.stream().pipeThrough(new DecompressionStream("gzip"));
  const text = await new Response(stream).text();
  return JSON.parse(text);
}

export async function getCachedKills(
  systemId: number,
): Promise<{ data: RawKillsResponse; freshTo: number } | null> {
  try {
    const db = await getDB();
    const entry = await new Promise<CachedEntry | undefined>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(systemId);
      req.onsuccess = () => resolve(req.result as CachedEntry | undefined);
      req.onerror = () => resolve(undefined);
    });
    if (!entry) return null;
    const data = await decompress(entry.compressed);
    return { data, freshTo: entry.freshTo };
  } catch {
    return null;
  }
}

export async function setCachedKills(
  systemId: number,
  data: RawKillsResponse,
  freshTo: number,
): Promise<void> {
  try {
    const compressed = await compress(data);
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put({ systemId, compressed, freshTo } satisfies CachedEntry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

export function mergeKillsDedup(
  existing: RawKillsResponse,
  incoming: RawKillsResponse,
): RawKillsResponse {
  if (incoming.count === 0) return existing;

  const existingIds = new Set(existing.killmail_ids);
  const ids: number[] = [],
    x: number[] = [],
    y: number[] = [],
    z: number[] = [],
    times: number[] = [],
    ships: number[] = [];

  for (let i = 0; i < incoming.count; i++) {
    if (existingIds.has(incoming.killmail_ids[i])) continue;
    ids.push(incoming.killmail_ids[i]);
    x.push(incoming.x[i]);
    y.push(incoming.y[i]);
    z.push(incoming.z[i]);
    times.push(incoming.killmail_times[i]);
    ships.push(incoming.ship_types[i]);
  }

  if (ids.length === 0) return existing;

  const order = ids.map((_, i) => i).sort((a, b) => times[b] - times[a]);

  return mergeKills(existing, {
    count: ids.length,
    killmail_ids: order.map((i) => ids[i]),
    x: order.map((i) => x[i]),
    y: order.map((i) => y[i]),
    z: order.map((i) => z[i]),
    killmail_times: order.map((i) => times[i]),
    ship_types: order.map((i) => ships[i]),
  });
}

export function mergeKills(
  existing: RawKillsResponse,
  incoming: RawKillsResponse,
): RawKillsResponse {
  if (incoming.count === 0) return existing;

  const n1 = existing.count;
  const n2 = incoming.count;
  const total = n1 + n2;

  const killmail_ids = new Array<number>(total);
  const x = new Array<number>(total);
  const y = new Array<number>(total);
  const z = new Array<number>(total);
  const killmail_times = new Array<number>(total);
  const ship_types = new Array<number>(total);

  let i = 0,
    j = 0,
    k = 0;

  while (i < n1 && j < n2) {
    if (existing.killmail_times[i] >= incoming.killmail_times[j]) {
      killmail_ids[k] = existing.killmail_ids[i];
      x[k] = existing.x[i];
      y[k] = existing.y[i];
      z[k] = existing.z[i];
      killmail_times[k] = existing.killmail_times[i];
      ship_types[k] = existing.ship_types[i];
      i++;
    } else {
      killmail_ids[k] = incoming.killmail_ids[j];
      x[k] = incoming.x[j];
      y[k] = incoming.y[j];
      z[k] = incoming.z[j];
      killmail_times[k] = incoming.killmail_times[j];
      ship_types[k] = incoming.ship_types[j];
      j++;
    }
    k++;
  }

  while (i < n1) {
    killmail_ids[k] = existing.killmail_ids[i];
    x[k] = existing.x[i];
    y[k] = existing.y[i];
    z[k] = existing.z[i];
    killmail_times[k] = existing.killmail_times[i];
    ship_types[k] = existing.ship_types[i];
    i++;
    k++;
  }

  while (j < n2) {
    killmail_ids[k] = incoming.killmail_ids[j];
    x[k] = incoming.x[j];
    y[k] = incoming.y[j];
    z[k] = incoming.z[j];
    killmail_times[k] = incoming.killmail_times[j];
    ship_types[k] = incoming.ship_types[j];
    j++;
    k++;
  }

  return { count: total, killmail_ids, x, y, z, killmail_times, ship_types };
}
