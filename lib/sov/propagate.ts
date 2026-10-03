import {
  SEED_HIGH_ADM,
  SEED_HIGH_WEIGHT,
  SEED_HIGH_HOPS,
  SEED_LOW_PER_ADM,
  SEED_LOW_HOPS,
  W_NPC,
  NPC_HOPS,
  DECAY,
  SEC_SEED_EXCLUDE,
  KIND_FACTION,
} from "./kernel";

export interface SovSource {
  systemIndex: number;
  ownerIndex: number;
  weight: number;
}

export interface SovOwner {
  ownerIndex: number;
  kind: number;
  id: number;
  name: string | null;
  ticker: string | null;
  systemCount: number;
}

export interface PropagateInput {
  systemIds: number[];
  ownerIdx: number[];
  adm: number[];
  ownerKinds: number[];
  ownerIds: number[];
  ownerNames: (string | null)[];
  ownerTickers: (string | null)[];
  mapSystemIDs: number[];
  edges: number[] | undefined;
  securityStatuses: number[];
}

export interface PropagateResult {
  sources: SovSource[];
  owners: SovOwner[];
  excludedSeedCount: number;
}

const adjacencyCache = new WeakMap<number[], number[][]>();

export function buildAdjacency(
  edges: number[] | undefined,
  systemCount: number,
): number[][] {
  if (!edges) return Array.from({ length: systemCount }, () => []);
  const cached = adjacencyCache.get(edges);
  if (cached && cached.length === systemCount) return cached;

  const adj: number[][] = Array.from({ length: systemCount }, () => []);
  for (let i = 0; i + 1 < edges.length; i += 2) {
    const a = edges[i];
    const b = edges[i + 1];
    if (a < systemCount && b < systemCount) {
      adj[a].push(b);
      adj[b].push(a);
    }
  }
  adjacencyCache.set(edges, adj);
  return adj;
}

interface Seed {
  weight: number;
  hops: number;
}

function seedFor(kind: number, adm: number): Seed {
  if (kind === KIND_FACTION) return { weight: W_NPC, hops: NPC_HOPS };
  if (adm >= SEED_HIGH_ADM)
    return { weight: SEED_HIGH_WEIGHT, hops: SEED_HIGH_HOPS };
  return { weight: SEED_LOW_PER_ADM * adm, hops: SEED_LOW_HOPS };
}

export function propagate(input: PropagateInput): PropagateResult {
  const {
    systemIds,
    ownerIdx,
    adm,
    ownerKinds,
    ownerIds,
    ownerNames,
    ownerTickers,
    mapSystemIDs,
    edges,
    securityStatuses,
  } = input;

  const owners: SovOwner[] = ownerIds.map((id, i) => ({
    ownerIndex: i,
    kind: ownerKinds[i],
    id,
    name: ownerNames[i] ?? null,
    ticker: ownerTickers[i] ?? null,
    systemCount: 0,
  }));
  for (const oi of ownerIdx) if (owners[oi]) owners[oi].systemCount++;

  const indexById = new Map<number, number>();
  for (let i = 0; i < mapSystemIDs.length; i++)
    indexById.set(mapSystemIDs[i], i);

  const adj = buildAdjacency(edges, mapSystemIDs.length);

  const acc = new Map<string, SovSource>();
  const add = (systemIndex: number, ownerIndex: number, weight: number) => {
    const key = `${systemIndex}:${ownerIndex}`;
    const existing = acc.get(key);
    if (existing) existing.weight += weight;
    else acc.set(key, { systemIndex, ownerIndex, weight });
  };

  let excludedSeedCount = 0;
  const visited = new Int32Array(mapSystemIDs.length).fill(-1);

  for (let s = 0; s < systemIds.length; s++) {
    const seedIndex = indexById.get(systemIds[s]);
    if (seedIndex === undefined) continue;
    if (securityStatuses[seedIndex] >= SEC_SEED_EXCLUDE) {
      excludedSeedCount++;
      continue;
    }
    const ownerIndex = ownerIdx[s];
    const { weight, hops } = seedFor(ownerKinds[ownerIndex], adm[s]);

    visited[seedIndex] = s;
    let frontier = [seedIndex];
    for (let hop = 0; hop <= hops; hop++) {
      const w = weight * Math.pow(DECAY, hop);
      for (const node of frontier) add(node, ownerIndex, w);
      if (hop === hops) break;
      const next: number[] = [];
      for (const node of frontier) {
        for (const nb of adj[node]) {
          if (visited[nb] !== s) {
            visited[nb] = s;
            next.push(nb);
          }
        }
      }
      frontier = next;
    }
  }

  return { sources: [...acc.values()], owners, excludedSeedCount };
}
