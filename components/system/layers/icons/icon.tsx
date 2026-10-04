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
import { getIconURL } from "@/lib/eve/icon-url";
import { useHoverListStore } from "@/stores/system/hover-list-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { worldPerPixel } from "@/lib/system/pixel-scale";
import { useClickGate } from "@/hooks/use-click-gate";

const ICON_PIXELS = 16;
const getOrigin = () => useFloatingOriginStore.getState().origin;

let sharedBackdrop: THREE.CanvasTexture | null = null;
function getBackdropTexture(): THREE.CanvasTexture {
  if (sharedBackdrop) return sharedBackdrop;
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const c = size / 2;
  const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
  gradient.addColorStop(0, "rgba(0,0,0,0.75)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  sharedBackdrop = new THREE.CanvasTexture(canvas);
  return sharedBackdrop;
}

interface IconProps {
  id: number;
  position: [number, number, number];
  iconID: number;
  hoverColor?: [number, number, number] | string;
  visible: boolean;
  label: string;
  onDoubleClick?: () => void;
}

export const Icon = React.memo(function Icon({
  id,
  position,
  iconID,
  hoverColor,
  visible,
  label,
  onDoubleClick,
}: IconProps) {
  const { gl } = useThree();
  const controlsRef = useContext(ControlsContext);
  const setActive = useHoverListStore((s) => s.setActive);
  const clearDelayed = useHoverListStore((s) => s.clearDelayed);

  const [hovered, setHovered] = useState(false);

  const billboardRef = useRef<THREE.Group>(null!);
  const tmpVec = useRef(new THREE.Vector3());
  const toIcon = useRef(new THREE.Vector3());
  const lastVersion = useRef(-1);
  const lastOrigin = useRef<[number, number, number]>([NaN, NaN, NaN]);
  const gate = useClickGate(
    () => controlsRef?.animateTo(position),
    onDoubleClick,
  );

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

  const backdropTexture = getBackdropTexture();

  const { url, tintColor } = useMemo(() => {
    const url = getIconURL(iconID);
    const tintColor = hovered ? (hoverColor ?? "white") : "gray";
    return { url, tintColor };
  }, [iconID, hoverColor, hovered]);

  const texture = useTexture(url);

  const handleHover = (e: ThreeEvent<MouseEvent>) => {
    if (visible) {
      e.stopPropagation();
      setHovered(true);
      setActive(id, position);
    }
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!visible) return;
    e.stopPropagation();
    gate.click(e.detail);
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!visible || !onDoubleClick) return;
    e.stopPropagation();
    gate.doubleClick();
  };

  return (
    <Billboard
      ref={billboardRef}
      position={position}
      onPointerOver={handleHover}
      onPointerOut={() => {
        setHovered(false);
        clearDelayed();
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      visible={visible}
      renderOrder={10}
    >
      <group>
        <mesh position={[0, 0, -0.001]} raycast={() => null} renderOrder={10}>
          <planeGeometry args={[1.6, 1.6]} />
          <meshBasicMaterial
            map={backdropTexture}
            transparent
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
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
            opacity={0.4}
            depthTest={false}
            depthWrite={false}
            toneMapped={false}
            side={THREE.DoubleSide}
            blending={THREE.NormalBlending}
          />
        </mesh>
        <Text
          visible={hovered}
          position={[1.2, 0, 0.001]}
          anchorX="left"
          anchorY="middle"
          fontSize={0.9}
          maxWidth={20}
          lineHeight={0.95}
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
