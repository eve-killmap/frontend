import { useState, useEffect } from "react";
import {
  ConstellationData,
  MapData,
  RegionData,
  SystemsData,
} from "@/lib/schema/map-schema";
import {
  AnoikisMapDataSchema,
  ConstellationDataSchema,
  MapDataSchema,
  NewEdenConstellationDataSchema,
  NewEdenMapDataSchema,
  NewEdenRegionDataSchema,
  RegionDataSchema,
} from "@/lib/schema/map-schema.zod";
import { MapCanvas } from "@/components/map/map-canvas";
import { MapUI } from "@/components/map/ui/map-ui";
import LoadingPage from "@/components/loading";
import { ErrorPageView } from "@/components/error-page";
import { BACKEND_BASE_URL } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";
import { TooltipProvider } from "../ui/tooltip";
import { useDocumentTitle } from "@/lib/document-title";
import { fetchSovereigntyCached } from "@/lib/api/sovereignty";
import { fetchSystemsCached } from "@/lib/api/systems";
import { useMapSystemsStore } from "@/stores/map/map-systems-store";
import { setOriginatingMap } from "@/lib/map/originating-map";

const MAP_TITLES: Record<string, string> = {
  "new-eden": "New Eden",
  anoikis: "Anoikis",
  "abyssal-deadspace": "Abyssal Deadspace",
  tutorials: "Tutorials",
};

interface MapLoaderProps {
  mapType: string;
}

interface MapDataResult {
  mapData: MapData;
  constellationData: ConstellationData;
  regionData: RegionData;
  systemsData: SystemsData;
}

const mapDataCache = new Map<string, Promise<MapDataResult>>();

function fetchMapData(mapType: string): Promise<MapDataResult> {
  let cached = mapDataCache.get(mapType);
  if (!cached) {
    cached = fetchMapDataUncached(mapType).catch((e) => {
      mapDataCache.delete(mapType);
      throw e;
    });
    mapDataCache.set(mapType, cached);
  }
  return cached;
}

async function fetchMapDataUncached(mapType: string): Promise<MapDataResult> {
  const base = `${BACKEND_BASE_URL}/static`;

  const isNewEden = mapType === "new-eden";

  const mapSchema =
    mapType === "new-eden"
      ? NewEdenMapDataSchema
      : mapType === "anoikis"
        ? AnoikisMapDataSchema
        : MapDataSchema;

  const [mapData, constellationData, regionData, systemsData] =
    await Promise.all([
      apiFetch(`${base}/universe/${mapType}/map.json`, mapSchema, {
        cache: "no-cache",
      }),
      apiFetch(
        `${base}/universe/${mapType}/constellations.json`,
        isNewEden ? NewEdenConstellationDataSchema : ConstellationDataSchema,
        { cache: "no-cache" },
      ),
      apiFetch(
        `${base}/universe/${mapType}/regions.json`,
        isNewEden ? NewEdenRegionDataSchema : RegionDataSchema,
        { cache: "no-cache" },
      ),
      fetchSystemsCached(),
    ]);

  return { mapData, constellationData, regionData, systemsData };
}

export function MapLoader({ mapType }: MapLoaderProps) {
  useDocumentTitle(MAP_TITLES[mapType] ?? "New Eden");

  const [data, setData] = useState<MapDataResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setOriginatingMap(mapType);
  }, [mapType]);

  useEffect(() => {
    let canceled = false;
    setError(null);
    setData(null);

    fetchMapData(mapType)
      .then((result) => {
        if (!canceled) setData(result);
      })
      .catch((e) => {
        if (!canceled) setError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      canceled = true;
    };
  }, [mapType, retryCount]);

  useEffect(() => {
    if (mapType === "new-eden") fetchSovereigntyCached().catch(() => {});
  }, [mapType]);

  const setSystemIDs = useMapSystemsStore((s) => s.setSystemIDs);
  useEffect(() => {
    setSystemIDs(data ? new Set(data.mapData.systemIDs) : null);
    return () => setSystemIDs(null);
  }, [data, setSystemIDs]);

  if (error)
    return (
      <ErrorPageView
        heading="Couldn't load the map"
        subheading="The map data could not be loaded."
        errorCode="ERR_LOAD_FAILED"
        message={error.message}
        onRetry={() => setRetryCount((c) => c + 1)}
        backToMap={false}
      />
    );

  if (!data) return <LoadingPage />;

  const { mapData, constellationData, regionData, systemsData } = data;

  return (
    <div className="relative w-full h-screen bg-abyss">
      <MapCanvas
        mapType={mapType}
        mapData={mapData}
        constellationData={constellationData}
        regionData={regionData}
      />
      <TooltipProvider>
        <MapUI systemsData={systemsData} mapType={mapType} />
      </TooltipProvider>
    </div>
  );
}
