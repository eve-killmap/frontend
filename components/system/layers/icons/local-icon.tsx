import React, {
  useState,
  useContext,
  MouseEvent,
  useMemo,
  useRef,
  useEffect,
} from "react";
import * as THREE from "three";
import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Text, useTexture } from "@react-three/drei";
import { ControlsContext } from "@/components/system/camera-context";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { worldPerPixel } from "@/lib/system/pixel-scale";

const ICON_PIXELS = 16;
const getOrigin = () => useFloatingOriginStore.getState().origin;

interface LocalIconProps {
  icon: string;
  position: [number, number, number];
  hoverColor?: [number, number, number] | string;
  visible: boolean;
  label: string;
}

export const LocalIcon = React.memo(function LocalIcon({
  icon,
  position,
  hoverColor,
  visible,
  label,
}: LocalIconProps) {
  const { gl } = useThree();
  const controlsRef = useContext(ControlsContext);

  const [hovered, setHovered] = useState(false);

  const billboardRef = useRef<THREE.Group>(null!);
  const tmpVec = useRef(new THREE.Vector3());
  const toIcon = useRef(new THREE.Vector3());
  const lastVersion = useRef(-1);
  const lastOrigin = useRef<[number, number, number]>([NaN, NaN, NaN]);

  useEffect(() => {
    gl.domElement.style.cursor = hovered ? "pointer" : "";
    return () => {
      gl.domElement.style.cursor = "";
    };
  }, [hovered, gl]);

  useFrame(() => {
    if (!billboardRef.current) return;

    const origin = getOrigin();
    const originChanged =
      origin[0] !== lastOrigin.current[0] ||
      origin[1] !== lastOrigin.current[1] ||
      origin[2] !== lastOrigin.current[2];
    if (cameraMetrics.cameraVersion === lastVersion.current && !originChanged)
      return;
    lastVersion.current = cameraMetrics.cameraVersion;
    lastOrigin.current[0] = origin[0];
    lastOrigin.current[1] = origin[1];
    lastOrigin.current[2] = origin[2];

    tmpVec.current.set(
      position[0] - origin[0],
      position[1] - origin[1],
      position[2] - origin[2],
    );
    toIcon.current.subVectors(tmpVec.current, cameraMetrics.cameraPos);
    const depth = toIcon.current.dot(cameraMetrics.worldDir);

    if (depth <= 0) {
      billboardRef.current.scale.setScalar(0);
      return;
    }

    const scale =
      ICON_PIXELS *
      worldPerPixel(
        depth,
        cameraMetrics.halfTanFov,
        cameraMetrics.viewportHeight,
      );
    billboardRef.current.scale.setScalar(scale);
  });

  const { tintColor } = useMemo(() => {
    const tintColor = hovered ? (hoverColor ?? "white") : "gray";
    return { tintColor };
  }, [hoverColor, hovered]);

  const texture = useTexture(icon);

  const handleHover = (e: ThreeEvent<MouseEvent>) => {
    if (visible) {
      e.stopPropagation();
      setHovered(true);
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (visible) {
      e.stopPropagation();
      controlsRef?.animateTo(position);
    }
  };

  return (
    <Billboard
      ref={billboardRef}
      position={position}
      onPointerOver={handleHover}
      onPointerOut={() => setHovered(false)}
      onClick={handleClick}
      visible={visible}
      renderOrder={10}
    >
      <group>
        <mesh renderOrder={10}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={texture}
            transparent
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            color={tintColor}
            side={THREE.DoubleSide}
            blending={THREE.NormalBlending}
          />
        </mesh>
        <mesh
          visible={hovered}
          position={[0, 0, 0.001]}
          raycast={() => null}
          renderOrder={11}
        >
          <ringGeometry args={[0.7, 0.78, 64]} />
          <meshBasicMaterial
            color={hoverColor}
            transparent
            opacity={0.3}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
            blending={THREE.NormalBlending}
          />
        </mesh>
        <Text
          visible={hovered}
          position={[1.2, -0.09, 0.001]}
          anchorX="left"
          anchorY="middle"
          fontSize={0.9}
          maxWidth={20}
          color="white"
          font="/fonts/Barlow-Medium.ttf"
          outlineWidth={0.05}
          outlineColor="black"
          material-depthTest={false}
          material-depthWrite={false}
          raycast={() => null}
          renderOrder={12}
        >
          {label}
        </Text>
      </group>
    </Billboard>
  );
});
