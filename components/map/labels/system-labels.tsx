import { Html, Text } from "@react-three/drei";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { slugify } from "@/lib/formatting/slugify";
import { useMapStore } from "@/stores/map/map-store";
import { useTimeRangeStore } from "@/stores/time-range-store";
import { navigateTo } from "@/lib/navigation-functions";
import { AppLink } from "@/components/common/app-link";
import { SystemSparkline } from "@/components/map/labels/system-sparkline";
import { mapMorphState } from "@/lib/map/map-morph-state";
import { mapMetrics } from "@/lib/map/map-metrics";
import { formatActivityRangeLabel } from "@/lib/map/system-kills-query";
import { useActivityData } from "@/hooks/map/use-activity-data";
import { useJumpsData } from "@/hooks/map/use-jumps-data";
import {
  securityIndex,
  SECURITY_HEX,
  formatSecurity,
  WORMHOLE_CLASS_HEX,
  wormholeEffectHex,
} from "@/lib/map/system-colors";
import {
  displayWormholeClassLabel,
  wormholeEffectLabel,
} from "@/lib/map/wormhole";
import { pointWorldRadius } from "@/lib/map/point-size";
import { inViewport, viewportBox } from "@/lib/map/viewport";
import { isTriglavianSystem, TRIGLAVIAN_FONT } from "@/lib/map/triglavian";
import { SovOwnerLookup } from "@/hooks/map/use-system-colors";

const SYSTEM_LATIN_FONT = "/fonts/Barlow-Medium.ttf";

interface SystemLabelsProps {
  positions2D: Float32Array;
  data: {
    systemName: string;
    constellationName: string;
    regionName: string;
    systemID: number;
    securityStatus: number;
    wormholeClassID?: number;
    wormholeEffect?: number;
  }[];
  baseScale: number;
  baseFontSize: number;
  beginFade: number;
  endFade: number;
  visible: boolean;
  pointScale: number;
  triglavianFont: boolean;
  sovOwnerFor: SovOwnerLookup | undefined;
}

interface VisibleSystem {
  index: number;
  name: string;
  x: number;
  y: number;
}

export function sameVisibleMembership(
  prev: VisibleSystem[],
  next: VisibleSystem[],
): boolean {
  if (prev.length !== next.length) return false;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].index !== next[i].index) return false;
  }
  return true;
}

export const SystemLabels = React.memo(function SystemLabels({
  positions2D,
  data,
  baseScale,
  baseFontSize,
  beginFade,
  endFade,
  visible,
  pointScale,
  triglavianFont,
  sovOwnerFor,
}: SystemLabelsProps) {
  const { camera, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null!);

  const [visibleSystems, setVisibleSystems] = useState<VisibleSystem[]>([]);

  const hoveredSystemIndex = useMapStore((s) => s.hoveredSystemIndex);
  const activityRange = useTimeRangeStore((s) => s.range);
  const colorMode = useMapStore((s) => s.colorMode);

  const { lookup: activityLookup, filterActive } = useActivityData(
    colorMode === "activity",
  );
  const showKills = colorMode === "activity" || filterActive;
  const effectiveMode = filterActive ? "activity" : colorMode;
  const { lookup: jumpsLookup } = useJumpsData(effectiveMode === "jumps");

  const prevCameraState = useRef<{ x: number; y: number; zoom: number } | null>(
    null,
  );
  const prevMorphT = useRef<number | null>(null);
  const prevPointScale = useRef<number>(-1);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 1,
    });
  }, []);

  useEffect(() => {
    gl.domElement.style.cursor = hoveredSystemIndex != null ? "pointer" : "";
    return () => {
      gl.domElement.style.cursor = "";
    };
  }, [hoveredSystemIndex, gl]);

  const hoveredSystem = useMemo(() => {
    if (hoveredSystemIndex == null) return null;
    const d = data[hoveredSystemIndex];
    return {
      index: hoveredSystemIndex,
      systemName: d.systemName,
      constellationName: d.constellationName,
      regionName: d.regionName,
      systemID: d.systemID,
      securityStatus: d.securityStatus,
      wormholeClassID: d.wormholeClassID,
      wormholeEffect: d.wormholeEffect,
      x: positions2D[hoveredSystemIndex * 2],
      y: positions2D[hoveredSystemIndex * 2 + 1],
    };
  }, [hoveredSystemIndex, data, positions2D]);

  useFrame(() => {
    if (!visible) return;

    const cam = camera as THREE.OrthographicCamera;
    const { x, y } = cam.position;
    const zoom = cam.zoom;

    const morphT = mapMorphState.t;
    const prev = prevCameraState.current;
    if (
      prev &&
      prev.x === x &&
      prev.y === y &&
      prev.zoom === zoom &&
      prevMorphT.current === morphT &&
      prevPointScale.current === pointScale
    ) {
      return;
    }
    prevCameraState.current = { x, y, zoom };
    prevMorphT.current = morphT;
    prevPointScale.current = pointScale;

    const opacity = THREE.MathUtils.smoothstep(zoom, beginFade, endFade);
    material.opacity = opacity;

    const scale = baseScale / zoom;

    if (groupRef.current) {
      groupRef.current.scale.set(scale, scale, 1);
      const invS = 1 / scale;
      const pr = pointWorldRadius(zoom, pointScale);
      for (const child of groupRef.current.children) {
        const wp = child.userData.worldPos as THREE.Vector3;
        child.position.set(wp.x * invS, (wp.y - pr) * invS, wp.z);
      }
    }

    if (opacity < 0.01) {
      if (visibleSystems.length > 0) {
        setVisibleSystems([]);
        mapMetrics.visibleLabels = 0;
      }
      return;
    }

    const box = viewportBox(cam);

    const pVisibleSystems: VisibleSystem[] = [];
    const systemCount = positions2D.length / 2;

    for (let i = 0; i < systemCount; i++) {
      const sx = positions2D[i * 2];
      const sy = positions2D[i * 2 + 1];

      if (inViewport(box, sx, sy)) {
        pVisibleSystems.push({
          index: i,
          name: data[i].systemName,
          x: sx,
          y: sy,
        });
      }
    }

    if (!sameVisibleMembership(visibleSystems, pVisibleSystems)) {
      setVisibleSystems(pVisibleSystems);
      mapMetrics.visibleLabels = pVisibleSystems.length;
    }
  });

  const handleClick = (systemName: string) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const slug = slugify(systemName);
    navigateTo?.(`/${slug}`);
  };

  const sec = hoveredSystem?.securityStatus;
  const secText =
    sec != null && Number.isFinite(sec) ? formatSecurity(sec) : "–";
  const secColor = SECURITY_HEX[securityIndex(sec ?? NaN)];
  const whClassID = hoveredSystem?.wormholeClassID;
  const whClassLabel =
    whClassID != null
      ? displayWormholeClassLabel(whClassID, hoveredSystem?.systemName ?? "")
      : null;
  const whClassHex =
    whClassID != null ? WORMHOLE_CLASS_HEX[whClassID] : undefined;
  const whEffect = hoveredSystem?.wormholeEffect;
  const whEffectLabel = whEffect != null ? wormholeEffectLabel(whEffect) : null;
  const whEffectHex =
    whEffect != null ? wormholeEffectHex(whEffect) : undefined;
  const killCount =
    showKills && hoveredSystem && activityLookup
      ? activityLookup.countFor(hoveredSystem.systemID)
      : null;
  const jumpCount =
    effectiveMode === "jumps" && hoveredSystem && jumpsLookup
      ? jumpsLookup.countFor(hoveredSystem.systemID)
      : null;
  const sovOwner = hoveredSystem
    ? sovOwnerFor?.(hoveredSystem.systemID)
    : undefined;
  const hoverTrigClass =
    hoveredSystem &&
    triglavianFont &&
    isTriglavianSystem(hoveredSystem.systemID)
      ? "font-triglavian"
      : "";

  return (
    <>
      <group ref={groupRef} visible={visible}>
        {visibleSystems.map((system) => (
          <group
            key={system.index}
            userData={{ worldPos: new THREE.Vector3(system.x, system.y, 2) }}
          >
            <Text
              material={material}
              anchorX="center"
              anchorY="top"
              position={[0, -3, 0]}
              fontSize={baseFontSize}
              color="white"
              font={
                triglavianFont &&
                isTriglavianSystem(data[system.index].systemID)
                  ? TRIGLAVIAN_FONT
                  : SYSTEM_LATIN_FONT
              }
              outlineWidth={0.05}
              outlineColor="black"
              onClick={handleClick(system.name)}
              renderOrder={3}
            >
              {system.name}
            </Text>
          </group>
        ))}
      </group>

      {hoveredSystem && (
        <group position={[hoveredSystem.x, hoveredSystem.y, 2]}>
          <Html zIndexRange={[100000, 0]} style={{ pointerEvents: "none" }}>
            <div
              className="flex flex-col items-stretch gap-1"
              style={{ transform: "translate(-50%, calc(-100% - 8px))" }}
            >
              <SystemSparkline
                key={hoveredSystem.systemID}
                systemID={hoveredSystem.systemID}
              />
              <AppLink
                to={`/${slugify(hoveredSystem.systemName)}`}
                style={{ pointerEvents: "auto", cursor: "pointer" }}
                className="flex flex-col items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-xs select-none ring-1 ring-border/50 text-foreground bg-panel border border-border"
              >
                <span className="font-bold tracking-wide">
                  <span className={hoverTrigClass}>
                    {hoveredSystem.systemName}
                  </span>
                  &nbsp;&nbsp;
                  {whClassLabel ? (
                    <span
                      className="font-mono font-semibold"
                      style={{ color: whClassHex }}
                    >
                      {whClassLabel}
                      <span
                        className="ml-1 text-2xs font-normal"
                        style={{ color: secColor }}
                      >
                        {secText}
                      </span>
                    </span>
                  ) : (
                    <span
                      className="font-mono font-medium"
                      style={{ color: secColor }}
                    >
                      {secText}
                    </span>
                  )}
                </span>
                <span className={`text-xs text-fg-muted ${hoverTrigClass}`}>
                  {hoveredSystem.constellationName}&nbsp;·&nbsp;
                  {hoveredSystem.regionName}
                </span>
                {colorMode === "wormhole-effect" && whEffectLabel && (
                  <span className="text-xs" style={{ color: whEffectHex }}>
                    {whEffectLabel}
                  </span>
                )}
                {sovOwner && (
                  <span className="text-xs text-fg-muted">
                    {sovOwner.name ?? "Unknown alliance"}
                    {sovOwner.ticker ? ` [${sovOwner.ticker}]` : ""}
                  </span>
                )}
                {killCount != null && (
                  <span className="text-xs text-fg-muted">
                    {killCount.toLocaleString()} kills (
                    {formatActivityRangeLabel(activityRange)})
                    {filterActive ? " · filtered" : ""}
                  </span>
                )}
                {jumpCount != null && (
                  <span className="text-xs text-fg-muted">
                    {jumpCount.toLocaleString()} jumps (1h)
                  </span>
                )}
              </AppLink>
            </div>
          </Html>
        </group>
      )}
    </>
  );
});
