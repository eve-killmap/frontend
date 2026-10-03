import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { MapData, isNewEdenMapData } from "@/lib/schema/map-schema";
import { useMapStore } from "@/stores/map/map-store";
import {
  useLiveKillStore,
  hotCounts,
  type LiveKillEntry,
} from "@/stores/live-kill-store";
import { FieldRenderer } from "@/lib/map/field/field-renderer";
import { fullFieldRegion, fieldTargetSize } from "@/lib/map/field/field-region";
import { useFieldOverlay } from "@/lib/map/field/use-field-overlay";
import { hotRampColor } from "@/lib/map/system-colors";
import {
  ALPHA_LOG_SCALE,
  ALPHA_MAX,
  INSENSITIVITY,
  SEED_HIGH_WEIGHT,
  VALIDINF,
} from "@/lib/sov/kernel";
import { buildHotSources } from "./hot-sources";

const RAMP_WIDTH = 256;
const PEAK_INTENSITY = SEED_HIGH_WEIGHT / INSENSITIVITY;
const EMPTY_ENTRIES: LiveKillEntry[] = [];

const displayVertex = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

const displayFragment = `
    precision highp float;
    uniform sampler2D uBest;
    uniform sampler2D uRamp;     // width = RAMP_WIDTH, height = 1
    uniform vec2 uTexel;         // set by useFieldOverlay; unused here
    uniform float uPeak;
    uniform float uOpacity;
    varying vec2 vUv;
    void main() {
        float I = texture2D(uBest, vUv).r;
        if (I < ${VALIDINF.toFixed(4)}) discard;
        float a = min(${ALPHA_MAX.toFixed(1)}, log(log(I + 1.0) + 1.0) * ${ALPHA_LOG_SCALE.toFixed(1)}) / 255.0;
        float t = clamp(I / uPeak, 0.0, 1.0);
        vec3 rgb = texture2D(uRamp, vec2(t, 0.5)).rgb;
        gl_FragColor = vec4(rgb, a * uOpacity);
    }
`;

function buildRampTexture(): THREE.DataTexture {
  const data = new Float32Array(RAMP_WIDTH * 4);
  for (let i = 0; i < RAMP_WIDTH; i++) {
    const [r, g, b] = hotRampColor(i / (RAMP_WIDTH - 1));
    data[i * 4] = r;
    data[i * 4 + 1] = g;
    data[i * 4 + 2] = b;
    data[i * 4 + 3] = 1;
  }
  const tex = new THREE.DataTexture(
    data,
    RAMP_WIDTH,
    1,
    THREE.RGBAFormat,
    THREE.FloatType,
  );
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  return tex;
}

export function HotOverlay({
  mapData,
  positions2D,
}: {
  mapData: MapData;
  positions2D: Float32Array;
}) {
  const overlay = useMapStore((s) => s.overlay);
  const overlayOpacity = useMapStore((s) => s.overlayOpacity);
  const enabled = overlay === "hot";
  const entries = useLiveKillStore((s) =>
    enabled ? s.entries : EMPTY_ENTRIES,
  );
  const gl = useThree((s) => s.gl);

  const region = useMemo(
    () =>
      fullFieldRegion(
        isNewEdenMapData(mapData)
          ? [mapData.meta.bbox, mapData.meta3D.bbox]
          : [mapData.meta.bbox],
      ),
    [mapData],
  );
  const target = useMemo(() => fieldTargetSize(region), [region]);

  const indexBySystemId = useMemo(() => {
    const m = new Map<number, number>();
    mapData.systemIDs.forEach((id, i) => m.set(id, i));
    return m;
  }, [mapData]);
  const mapSystemIds = useMemo(
    () => new Set(mapData.systemIDs),
    [mapData.systemIDs],
  );

  const renderer = useMemo(
    () => (enabled ? new FieldRenderer(gl) : null),
    [gl, enabled],
  );
  useEffect(() => {
    const r = renderer;
    return () => r?.dispose();
  }, [renderer]);

  const ramp = useMemo(buildRampTexture, []);
  useEffect(() => () => ramp.dispose(), [ramp]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uBest: { value: null },
          uRamp: { value: null },
          uTexel: { value: new THREE.Vector2(1, 1) },
          uPeak: { value: PEAK_INTENSITY },
          uOpacity: { value: 1 },
        },
        vertexShader: displayVertex,
        fragmentShader: displayFragment,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => {
    material.uniforms.uRamp.value = ramp;
  }, [material, ramp]);
  useEffect(() => {
    material.uniforms.uOpacity.value = overlayOpacity;
  }, [material, overlayOpacity]);

  const { sources, dataKey } = useMemo(() => {
    if (!enabled) return { sources: null, dataKey: "" };
    const { counts, max, tracked } = hotCounts(
      entries,
      Date.now(),
      mapSystemIds,
    );
    const built = buildHotSources(counts, max, indexBySystemId);
    return {
      sources: built,
      dataKey: `${tracked}:${max}:${counts.size}`,
    };
  }, [enabled, entries, mapSystemIds, indexBySystemId]);

  const { meshRef } = useFieldOverlay({
    renderer,
    region,
    target,
    positions2D,
    sources,
    groupCount: 1,
    dataKey,
    material,
  });

  if (!enabled) return null;

  return (
    <mesh
      ref={meshRef}
      renderOrder={-1}
      material={material}
      raycast={() => null}
      frustumCulled={false}
    >
      <planeGeometry
        args={[region.maxX - region.minX, region.maxY - region.minY]}
      />
    </mesh>
  );
}
