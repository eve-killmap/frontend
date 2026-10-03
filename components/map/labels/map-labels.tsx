import {
  ConstellationData,
  isAnoikisMapData,
  Locale,
  MapData,
  NewEdenLocale,
  RegionData,
} from "@/lib/schema/map-schema";
import React, { useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { LabelGroup } from "./label-group";
import { SystemLabels } from "./system-labels";
import { useLabelVisibility } from "@/stores/map/map-store";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { CAMERA_MARGIN, fitHalfExtents } from "@/lib/map/map-camera";
import { SovOwnerLookup } from "@/hooks/map/use-system-colors";
import {
  isTriglavianConstellation,
  isTriglavianRegion,
  TRIGLAVIAN_FONT,
} from "@/lib/map/triglavian";

const REFERENCE_FRUSTUM_HEIGHT = 9275307;

const LOCALE_LATIN_FONT = "/fonts/BarlowCondensed-Bold.ttf";

type Vec3 = [number, number, number];

function anchor3D(loc: Locale): { x: number; y: number } {
  return "position3D" in loc ? (loc as NewEdenLocale).position3D : loc.position;
}

interface MapLabelsProps {
  mapData: MapData;
  constellationData: ConstellationData;
  regionData: RegionData;
  positions2D: Float32Array;
  spanX: number;
  spanY: number;
  pointScale: number;
  sovOwnerFor: SovOwnerLookup | undefined;
}

export const MapLabels = React.memo(function MapLabels({
  mapData,
  constellationData,
  regionData,
  positions2D,
  spanX,
  spanY,
  pointScale,
  sovOwnerFor,
}: MapLabelsProps) {
  const { size } = useThree();

  const { showAllLabels, visibleLabels } = useLabelVisibility();
  const triglavianFont = useGlobalSettingsStore((s) => s.triglavianFont);

  const scaleFactor = useMemo(() => {
    const aspect = size.width / size.height;
    const { halfH } = fitHalfExtents(spanX, spanY, CAMERA_MARGIN, aspect);
    return (halfH * 2) / REFERENCE_FRUSTUM_HEIGHT;
  }, [spanX, spanY, size]);

  const regionLabels = useMemo(() => {
    return Object.entries(regionData).map(([id, region]) => {
      const p3 = anchor3D(region);
      const pos2D: Vec3 = [region.position.x, region.position.y, 10];
      const pos3D: Vec3 = [p3.x, p3.y, 10];
      const font =
        triglavianFont && isTriglavianRegion(Number(id))
          ? TRIGLAVIAN_FONT
          : LOCALE_LATIN_FONT;
      return { id, name: region.name, pos2D, pos3D, font };
    });
  }, [regionData, triglavianFont]);

  const constellationLabels = useMemo(() => {
    return Object.entries(constellationData).map(([id, constellation]) => {
      const p3 = anchor3D(constellation);
      const pos2D: Vec3 = [
        constellation.position.x,
        constellation.position.y,
        5,
      ];
      const pos3D: Vec3 = [p3.x, p3.y, 5];
      const font =
        triglavianFont && isTriglavianConstellation(Number(id))
          ? TRIGLAVIAN_FONT
          : LOCALE_LATIN_FONT;
      return { id, name: constellation.name, pos2D, pos3D, font };
    });
  }, [constellationData, triglavianFont]);

  const systemLabelData = useMemo(() => {
    const anoikis = isAnoikisMapData(mapData) ? mapData : null;
    const wormholeClassIDs = anoikis?.wormholeClassIDs;
    const wormholeEffects = anoikis?.wormholeEffects;
    return mapData.names.map((systemName, i) => {
      const constellationID = mapData.constellationIDs[i];
      const constellationName = constellationData[constellationID]?.name ?? "";
      const regionName =
        regionData[constellationData[constellationID]?.regionID]?.name ?? "";
      return {
        systemName,
        constellationName,
        regionName,
        systemID: mapData.systemIDs[i],
        securityStatus: mapData.securityStatuses[i],
        wormholeClassID: wormholeClassIDs?.[i],
        wormholeEffect: wormholeEffects?.[i],
      };
    });
  }, [mapData, constellationData, regionData]);

  return (
    <group>
      <LabelGroup
        labels={regionLabels}
        baseScale={10000 * scaleFactor}
        baseFontSize={13}
        beginFade={4}
        endFade={12}
        invertFade
        renderOrder={1}
        visible={showAllLabels && visibleLabels["region"]}
      />
      <LabelGroup
        labels={constellationLabels}
        baseScale={10000 * scaleFactor}
        baseFontSize={12}
        beginFade={4}
        endFade={12}
        invertFade={false}
        renderOrder={2}
        visible={showAllLabels && visibleLabels["constellation"]}
      />
      <SystemLabels
        positions2D={positions2D}
        data={systemLabelData}
        baseScale={9000 * scaleFactor}
        baseFontSize={10}
        beginFade={16}
        endFade={24}
        visible={showAllLabels && visibleLabels["system"]}
        pointScale={pointScale}
        triglavianFont={triglavianFont}
        sovOwnerFor={sovOwnerFor}
      />
    </group>
  );
});
