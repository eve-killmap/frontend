import { Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { mapMorphState } from "@/lib/map/map-morph-state";
import { smoothstep } from "@/lib/map/map-morph";
import { inViewport, viewportBox } from "@/lib/map/viewport";

interface LabelGroupProps {
  labels: {
    id: string;
    name: string;
    pos2D: [number, number, number];
    pos3D: [number, number, number];
    font: string;
  }[];
  baseScale: number;
  baseFontSize: number;
  beginFade: number;
  endFade: number;
  invertFade: boolean;
  visible: boolean;
  renderOrder?: number;
}

export const LabelGroup = React.memo(function LabelGroup({
  labels,
  baseScale,
  baseFontSize,
  beginFade,
  endFade,
  invertFade,
  visible,
  renderOrder = 0,
}: LabelGroupProps) {
  const groupRef = useRef<THREE.Group>(null!);

  const material = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: 1,
    });
  }, []);

  const { camera } = useThree();
  const prevState = useRef<{
    x: number;
    y: number;
    zoom: number;
    morphT: number;
  } | null>(null);

  useFrame(() => {
    if (!visible) return;

    const cam = camera as THREE.OrthographicCamera;
    const zoom = cam.zoom;
    const { x: cx, y: cy } = cam.position;
    const morphT = mapMorphState.t;

    const prev = prevState.current;
    if (
      prev &&
      prev.x === cx &&
      prev.y === cy &&
      prev.zoom === zoom &&
      prev.morphT === morphT
    )
      return;

    prevState.current = { x: cx, y: cy, zoom, morphT };

    let opacity = THREE.MathUtils.smoothstep(zoom, beginFade, endFade);
    if (invertFade) opacity = 1 - opacity;

    material.opacity = opacity;
    groupRef.current.visible = opacity > 0.01;
    if (opacity <= 0.01) return;

    const scale = baseScale / zoom;
    groupRef.current.scale.set(scale, scale, 1);

    const invS = 1 / scale;
    const box = viewportBox(cam);
    const e = smoothstep(morphT);
    for (const child of groupRef.current.children) {
      const ud = child.userData as {
        pos2D: THREE.Vector3;
        pos3D: THREE.Vector3;
      };
      const wx = ud.pos2D.x + (ud.pos3D.x - ud.pos2D.x) * e;
      const wy = ud.pos2D.y + (ud.pos3D.y - ud.pos2D.y) * e;
      child.position.set(wx * invS, wy * invS, ud.pos2D.z);
      child.visible = inViewport(box, wx, wy);
    }
  });

  return (
    <group ref={groupRef} visible={visible}>
      {labels.map((label) => (
        <group
          key={label.id}
          userData={{
            pos2D: new THREE.Vector3(
              label.pos2D[0],
              label.pos2D[1],
              label.pos2D[2],
            ),
            pos3D: new THREE.Vector3(
              label.pos3D[0],
              label.pos3D[1],
              label.pos3D[2],
            ),
          }}
        >
          <Text
            material={material}
            anchorX="center"
            anchorY="middle"
            fontSize={baseFontSize}
            color="white"
            font={label.font}
            outlineWidth={0.05}
            outlineColor="black"
            raycast={() => null}
            renderOrder={renderOrder}
          >
            {label.name}
          </Text>
        </group>
      ))}
    </group>
  );
});
