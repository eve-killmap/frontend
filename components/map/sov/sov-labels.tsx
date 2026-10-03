import { useEffect, useMemo, useRef } from "react";
import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useMapStore } from "@/stores/map/map-store";
import { useSovStore } from "@/stores/map/sov-store";
import { findBlobs, fontSizeForArea } from "@/lib/sov/blobs";
import { revealZoomForArea } from "@/lib/sov/label-layout";
import { KIND_FACTION } from "@/lib/sov/kernel";
import { CAMERA_MARGIN, fitHalfExtents } from "@/lib/map/map-camera";
import { inViewport, viewportBox } from "@/lib/map/viewport";

const REFERENCE_FRUSTUM_HEIGHT = 9275307;
const BASE_SCALE = 9000;

const REVEAL_STRENGTH = 0.7;
const REVEAL_ZOOM_CAP = 30;
const REVEAL_FADE_START = 0.5;

interface SovLabel {
  id: string;
  name: string;
  x: number;
  y: number;
  fontSize: number;
  revealZoom: number;
}

export function SovLabels({ spanX, spanY }: { spanX: number; spanY: number }) {
  const overlay = useMapStore((s) => s.overlay);
  const morphActive = useMapStore((s) => s.morphActive);
  const overlayOpacity = useMapStore((s) => s.overlayOpacity);
  const gridEntry = useSovStore((s) => s.grid);
  const data = useSovStore((s) => s.data);
  const { size, camera } = useThree();

  const scaleFactor = useMemo(() => {
    const aspect = size.width / size.height;
    const { halfH } = fitHalfExtents(spanX, spanY, CAMERA_MARGIN, aspect);
    return (halfH * 2) / REFERENCE_FRUSTUM_HEIGHT;
  }, [spanX, spanY, size]);

  const labels = useMemo<SovLabel[]>(() => {
    if (!gridEntry || !data) return [];
    const ownerById = new Map(
      data.owners
        .filter((o) => o.kind !== KIND_FACTION)
        .map((o) => [o.ownerIndex, o]),
    );
    const auPer = gridEntry.auPerIu;
    const blobs = findBlobs(gridEntry.grid).filter((b) =>
      ownerById.has(b.ownerIndex),
    );
    if (blobs.length === 0) return [];
    const maxArea = Math.max(...blobs.map((b) => b.areaIu2));
    return blobs.map((b) => {
      const owner = ownerById.get(b.ownerIndex)!;
      return {
        id: `${b.ownerIndex}:${Math.round(b.centroid[0])}:${Math.round(b.centroid[1])}`,
        name: owner.name ?? owner.ticker ?? `#${owner.id}`,
        x: b.centroid[0] * auPer,
        y: b.centroid[1] * auPer,
        fontSize: fontSizeForArea(b.areaIu2),
        revealZoom: revealZoomForArea(
          b.areaIu2,
          maxArea,
          REVEAL_STRENGTH,
          REVEAL_ZOOM_CAP,
        ),
      };
    });
  }, [gridEntry, data]);

  const materials = useMemo(
    () =>
      labels.map(
        () =>
          new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            depthTest: false,
            opacity: 0,
          }),
      ),
    [labels],
  );
  useEffect(() => () => materials.forEach((m) => m.dispose()), [materials]);

  const groupRef = useRef<THREE.Group>(null!);
  const prevState = useRef<{
    x: number;
    y: number;
    zoom: number;
    labels: SovLabel[];
    opacity: number;
  } | null>(null);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const vis = overlay === "sovereignty" && !morphActive && labels.length > 0;
    g.visible = vis;
    if (!vis) return;

    const cam = camera as THREE.OrthographicCamera;
    const zoom = cam.zoom;
    const { x: cx, y: cy } = cam.position;
    const prev = prevState.current;
    if (
      prev &&
      prev.x === cx &&
      prev.y === cy &&
      prev.zoom === zoom &&
      prev.labels === labels &&
      prev.opacity === overlayOpacity
    )
      return;
    prevState.current = { x: cx, y: cy, zoom, labels, opacity: overlayOpacity };

    const scale = (BASE_SCALE * scaleFactor) / zoom;
    g.scale.set(scale, scale, 1);
    const invS = 1 / scale;
    const box = viewportBox(cam);
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      const op =
        THREE.MathUtils.smoothstep(
          zoom,
          l.revealZoom * REVEAL_FADE_START,
          l.revealZoom,
        ) * overlayOpacity;
      materials[i].opacity = op;
      const child = g.children[i];
      if (child) {
        child.visible = op > 0.01 && inViewport(box, l.x, l.y);
        child.position.set(l.x * invS, l.y * invS, 8);
      }
    }
  });

  if (overlay !== "sovereignty" || labels.length === 0) return null;

  return (
    <group ref={groupRef}>
      {labels.map((l, i) => (
        <group key={l.id}>
          <Text
            material={materials[i]}
            anchorX="center"
            anchorY="middle"
            fontSize={l.fontSize}
            color="white"
            font="/fonts/BarlowCondensed-Bold.ttf"
            outlineWidth={0.05}
            outlineColor="black"
            raycast={() => null}
            renderOrder={2}
          >
            {l.name}
          </Text>
        </group>
      ))}
    </group>
  );
}
