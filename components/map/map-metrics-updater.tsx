import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MapData } from "@/lib/schema/map-schema";
import { mapMetrics, resetMapMetrics } from "@/lib/map/map-metrics";

export function MapMetricsUpdater({ mapData }: { mapData: MapData }) {
  const { camera, size } = useThree();

  useEffect(() => {
    mapMetrics.systems = mapData.systemIDs.length;
    mapMetrics.edges = mapData.edges ? mapData.edges.length / 2 : 0;
    return resetMapMetrics;
  }, [mapData]);

  useFrame(() => {
    mapMetrics.x = camera.position.x;
    mapMetrics.y = camera.position.y;
    mapMetrics.zoom = camera.zoom;
    mapMetrics.viewportWidth = size.width;
    mapMetrics.viewportHeight = size.height;
  }, -20);

  return null;
}
