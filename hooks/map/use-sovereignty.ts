import { useEffect, useMemo, useState } from "react";
import { MapData, isNewEdenMapData } from "@/lib/schema/map-schema";
import {
  fetchSovereigntyCached,
  SovereigntyResponse,
} from "@/lib/api/sovereignty";
import { buildSovData } from "@/lib/sov/build-sov-data";
import { useSovStore } from "@/stores/map/sov-store";

export function useLoadSovData(mapData: MapData): void {
  const neMap = isNewEdenMapData(mapData) ? mapData : null;
  const setData = useSovStore((s) => s.setData);
  const [response, setResponse] = useState<SovereigntyResponse | null>(null);

  useEffect(() => {
    if (!neMap) {
      setResponse(null);
      return;
    }
    let alive = true;
    fetchSovereigntyCached()
      .then((r) => {
        if (alive) setResponse(r);
      })
      .catch((e) => {
        if (alive) console.warn("sovereignty fetch failed", e);
      });
    return () => {
      alive = false;
    };
  }, [neMap]);

  const data = useMemo(
    () => (neMap && response ? buildSovData(response, neMap) : null),
    [neMap, response],
  );

  useEffect(() => {
    setData(data);
  }, [data, setData]);
  useEffect(() => () => setData(null), [setData]);
}
