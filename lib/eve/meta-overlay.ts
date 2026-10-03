import { apiFetch, singleFlight } from "@/lib/api/client";
import { BACKEND_BASE_URL } from "@/lib/net/endpoints";
import { TypeMetas, TypeMetasSchema } from "@/lib/schema/base-schema";

export const META_OVERLAYS: Record<number, string> = {
  2: "/overlays/tech2.png",
  3: "/overlays/storyline.png",
  4: "/overlays/faction.png",
  14: "/overlays/tech3.png",
  15: "/overlays/abyssal.png",
  19: "/overlays/timelimited.png",
  52: "/overlays/structureoverlayfaction.png",
  53: "/overlays/structureoverlay.png",
  54: "/overlays/structureoverlayt2.png",
};

export type TypeMetaIndex = Map<number, number>;

export function buildTypeMetaIndex(typeMetas: TypeMetas): TypeMetaIndex {
  const index: TypeMetaIndex = new Map();
  for (const [meta, typeIds] of Object.entries(typeMetas)) {
    const metaId = Number(meta);
    for (const typeId of typeIds) index.set(typeId, metaId);
  }
  return index;
}

export function overlayPathForType(
  typeId: number,
  index: TypeMetaIndex,
): string | null {
  const metaId = index.get(typeId);
  if (metaId === undefined) return null;
  return META_OVERLAYS[metaId] ?? null;
}

export function fetchTypeMetas(): Promise<TypeMetas> {
  return singleFlight("type-metas", () =>
    apiFetch(
      `${BACKEND_BASE_URL}/static/type/typeMetas.json`,
      TypeMetasSchema,
      { cache: "no-cache" },
    ),
  );
}

let loadedIndex: TypeMetaIndex | null = null;
let indexPromise: Promise<TypeMetaIndex> | null = null;

export function peekTypeMetaIndex(): TypeMetaIndex | null {
  return loadedIndex;
}

export function loadTypeMetaIndex(): Promise<TypeMetaIndex> {
  if (!indexPromise)
    indexPromise = fetchTypeMetas()
      .then((typeMetas) => {
        loadedIndex = buildTypeMetaIndex(typeMetas);
        return loadedIndex;
      })
      .catch((e) => {
        indexPromise = null;
        throw e;
      });
  return indexPromise;
}
