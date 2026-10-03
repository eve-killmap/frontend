import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { MapData, isNewEdenMapData } from "@/lib/schema/map-schema";
import { useMapStore } from "@/stores/map/map-store";
import { useSovStore } from "@/stores/map/sov-store";
import { FieldRenderer, FieldSource } from "@/lib/map/field/field-renderer";
import { fullFieldRegion, fieldTargetSize } from "@/lib/map/field/field-region";
import { useFieldOverlay } from "@/lib/map/field/use-field-overlay";
import {
  VALIDINF,
  ALPHA_LOG_SCALE,
  ALPHA_MAX,
  BORDER_ALPHA,
  KIND_FACTION,
} from "@/lib/sov/kernel";

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
    uniform sampler2D uPalette;   // width = ownerCount, height = 1; a = 0 for faction/NPC (discarded)
    uniform vec2 uTexel;          // 1/size
    uniform float uPaletteW;
    uniform float uSovOpacity;
    varying vec2 vUv;
    void main() {
        vec2 b = texture2D(uBest, vUv).rg;
        float I = b.r;
        if (I < ${VALIDINF.toFixed(4)}) discard;
        float a = min(${ALPHA_MAX.toFixed(1)}, log(log(I + 1.0) + 1.0) * ${ALPHA_LOG_SCALE.toFixed(1)}) / 255.0;
        float owner = b.g;
        // 4-neighbor ownership border.
        float oL = texture2D(uBest, vUv + vec2(-uTexel.x, 0.0)).g;
        float oR = texture2D(uBest, vUv + vec2( uTexel.x, 0.0)).g;
        float oU = texture2D(uBest, vUv + vec2(0.0,  uTexel.y)).g;
        float oD = texture2D(uBest, vUv + vec2(0.0, -uTexel.y)).g;
        float iL = texture2D(uBest, vUv + vec2(-uTexel.x, 0.0)).r;
        float iR = texture2D(uBest, vUv + vec2( uTexel.x, 0.0)).r;
        float iU = texture2D(uBest, vUv + vec2(0.0,  uTexel.y)).r;
        float iD = texture2D(uBest, vUv + vec2(0.0, -uTexel.y)).r;
        bool border =
            (iL >= ${VALIDINF.toFixed(4)} && abs(oL - owner) > 0.5) ||
            (iR >= ${VALIDINF.toFixed(4)} && abs(oR - owner) > 0.5) ||
            (iU >= ${VALIDINF.toFixed(4)} && abs(oU - owner) > 0.5) ||
            (iD >= ${VALIDINF.toFixed(4)} && abs(oD - owner) > 0.5);
        if (border) a = max(a, ${BORDER_ALPHA.toFixed(1)} / 255.0);
        vec2 uv = vec2((owner + 0.5) / uPaletteW, 0.5);
        vec4 pal = texture2D(uPalette, uv);
        // Faction/NPC space (palette alpha 0): paint nothing. Faction sources still
        // won the argmax here, so this also blocks player color from bleeding in.
        if (pal.a <= 0.0) discard;
        gl_FragColor = vec4(pal.rgb, a * pal.a * uSovOpacity);
    }
`;

export function SovOverlay({
  mapData,
  positions2D,
}: {
  mapData: MapData;
  positions2D: Float32Array;
}) {
  const overlay = useMapStore((s) => s.overlay);
  const overlayOpacity = useMapStore((s) => s.overlayOpacity);
  const neMap = isNewEdenMapData(mapData) ? mapData : null;
  const enabled = overlay === "sovereignty" && neMap !== null;

  const sovData = useSovStore((s) => s.data);
  const setGrid = useSovStore((s) => s.setGrid);
  const clearGrid = useSovStore((s) => s.clearGrid);
  const gl = useThree((s) => s.gl);

  const region = useMemo(
    () =>
      neMap ? fullFieldRegion([neMap.meta.bbox, neMap.meta3D.bbox]) : null,
    [neMap],
  );
  const target = useMemo(
    () => (region ? fieldTargetSize(region) : { w: 1, h: 1 }),
    [region],
  );

  const renderer = useMemo(
    () => (enabled ? new FieldRenderer(gl) : null),
    [gl, enabled],
  );
  useEffect(() => {
    const r = renderer;
    return () => r?.dispose();
  }, [renderer]);

  const prevPalette = useRef<THREE.DataTexture | null>(null);
  const palette = useMemo(() => {
    prevPalette.current?.dispose();
    if (!sovData) {
      prevPalette.current = null;
      return null;
    }
    const n = sovData.owners.length;
    const data = new Float32Array(n * 4);
    for (const o of sovData.owners) {
      const rgb = sovData.colorByOwner.get(o.ownerIndex) ?? [0.5, 0.5, 0.5];
      const base = o.ownerIndex * 4;
      data[base] = rgb[0];
      data[base + 1] = rgb[1];
      data[base + 2] = rgb[2];
      data[base + 3] = o.kind === KIND_FACTION ? 0.0 : 1.0;
    }
    const tex = new THREE.DataTexture(
      data,
      n,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    tex.needsUpdate = true;
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    prevPalette.current = tex;
    return tex;
  }, [sovData]);
  useEffect(() => () => prevPalette.current?.dispose(), []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uBest: { value: null },
          uPalette: { value: null },
          uTexel: { value: new THREE.Vector2(1, 1) },
          uPaletteW: { value: 1 },
          uSovOpacity: { value: 1 },
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
    material.uniforms.uPalette.value = palette;
    material.uniforms.uPaletteW.value = sovData?.owners.length ?? 1;
  }, [material, palette, sovData]);
  useEffect(() => {
    material.uniforms.uSovOpacity.value = overlayOpacity;
  }, [material, overlayOpacity]);

  const sources = useMemo<FieldSource[] | null>(
    () =>
      sovData
        ? sovData.sources.map((s) => ({
            systemIndex: s.systemIndex,
            groupIndex: s.ownerIndex,
            weight: s.weight,
          }))
        : null,
    [sovData],
  );

  const { meshRef } = useFieldOverlay({
    renderer,
    region,
    target,
    positions2D,
    sources,
    groupCount: sovData?.owners.length ?? 0,
    dataKey: sovData ? String(sovData.updatedAt) : "",
    material,
    onRebuild: (rgn, uPerIu, full) => {
      if (full && renderer)
        setGrid(renderer.readOwnership(rgn, uPerIu), uPerIu);
    },
  });

  useEffect(() => () => clearGrid(), [clearGrid]);

  if (!enabled || !region || !sovData) return null;

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
