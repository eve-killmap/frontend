import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  useLineVisibility,
  edgeTypeToKey,
  LineType,
  useMapStore,
} from "@/stores/map/map-store";
import { mapMorphState } from "@/lib/map/map-morph-state";
import { SCENE } from "@/lib/scene-colors";

const LINE_OPACITY = 0.5;
const BG_COLOR = new THREE.Color(SCENE.CANVAS_CLEAR);

function dimmed(color: THREE.ColorRepresentation): THREE.Color {
  return new THREE.Color(color).lerp(BG_COLOR, 1 - LINE_OPACITY);
}

const LINE_COLORS: Record<LineType, THREE.Color> = {
  normal: dimmed("blue"),
  constellation: dimmed("red"),
  regional: dimmed("purple"),
};

const HIGHLIGHT_COLOR = new THREE.Color(SCENE.HIGHLIGHT);

const LINE_TYPES: LineType[] = ["normal", "constellation", "regional"];

interface MapLinesProps {
  edgesData: number[];
  edgeTypesData: number[];
  positions2D: Float32Array;
}

export const MapLines = React.memo(function MapLines({
  edgesData,
  edgeTypesData,
  positions2D,
}: MapLinesProps) {
  const { showAllLines, visibleLines } = useLineVisibility();
  const hoveredSystemIndex = useMapStore((s) => s.hoveredSystemIndex);

  const { buffersByType, adjacencyBySystem, edges, fill } = useMemo(() => {
    const edges = new Uint32Array(edgesData ?? []);
    const edgeTypes = edgeTypesData ?? [];
    const edgeCount = edges.length / 2;

    const endpointsByType: Record<LineType, number[]> = {
      normal: [],
      constellation: [],
      regional: [],
    };
    const adjacencyBySystem = new Map<number, number[]>();

    for (let i = 0; i < edgeCount; i++) {
      const type = edgeTypeToKey(edgeTypes[i]);
      const a = edges[i * 2];
      const b = edges[i * 2 + 1];
      endpointsByType[type].push(a, b);

      if (!adjacencyBySystem.has(a)) adjacencyBySystem.set(a, []);
      if (!adjacencyBySystem.has(b)) adjacencyBySystem.set(b, []);
      adjacencyBySystem.get(a)!.push(i);
      adjacencyBySystem.get(b)!.push(i);
    }

    const buffersByType: Record<LineType, Float32Array> = {
      normal: new Float32Array(endpointsByType.normal.length * 3),
      constellation: new Float32Array(endpointsByType.constellation.length * 3),
      regional: new Float32Array(endpointsByType.regional.length * 3),
    };

    const fill = (pos: Float32Array) => {
      for (const type of LINE_TYPES) {
        const idx = endpointsByType[type];
        const buf = buffersByType[type];
        for (let j = 0; j < idx.length; j++) {
          const s = idx[j];
          buf[j * 3] = pos[s * 2];
          buf[j * 3 + 1] = pos[s * 2 + 1];
          buf[j * 3 + 2] = 0;
        }
      }
    };

    fill(positions2D);
    return { endpointsByType, buffersByType, adjacencyBySystem, edges, fill };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edgesData, edgeTypesData]);

  const attrRefs = useRef<Record<LineType, THREE.BufferAttribute | null>>({
    normal: null,
    constellation: null,
    regional: null,
  });
  const prevMorphT = useRef<number>(mapMorphState.t);

  useFrame(() => {
    const morphT = mapMorphState.t;
    if (morphT === prevMorphT.current) return;
    prevMorphT.current = morphT;
    fill(positions2D);
    for (const type of LINE_TYPES) {
      const attr = attrRefs.current[type];
      if (attr) attr.needsUpdate = true;
    }
  });

  const highlightPositions = useMemo(() => {
    if (hoveredSystemIndex === null) return null;
    const edgeIndices = adjacencyBySystem.get(hoveredSystemIndex);
    if (!edgeIndices?.length) return null;

    const positions = new Float32Array(edgeIndices.length * 6);
    for (let j = 0; j < edgeIndices.length; j++) {
      const i = edgeIndices[j];
      const a = edges[i * 2],
        b = edges[i * 2 + 1];
      const base = j * 6;
      positions[base] = positions2D[a * 2];
      positions[base + 1] = positions2D[a * 2 + 1];
      positions[base + 2] = 0;
      positions[base + 3] = positions2D[b * 2];
      positions[base + 4] = positions2D[b * 2 + 1];
      positions[base + 5] = 0;
    }
    return positions;
  }, [hoveredSystemIndex, adjacencyBySystem, edges, positions2D]);

  return (
    <>
      {LINE_TYPES.map((type) => (
        <lineSegments
          key={type}
          frustumCulled={false}
          renderOrder={0}
          visible={showAllLines && visibleLines[type]}
        >
          <bufferGeometry>
            <bufferAttribute
              ref={(el: THREE.BufferAttribute | null) => {
                attrRefs.current[type] = el;
              }}
              attach="attributes-position"
              args={[buffersByType[type], 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={LINE_COLORS[type]} depthWrite={false} />
        </lineSegments>
      ))}
      {highlightPositions && (
        <lineSegments frustumCulled={false} renderOrder={0}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[highlightPositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={HIGHLIGHT_COLOR} depthWrite={false} />
        </lineSegments>
      )}
    </>
  );
});
