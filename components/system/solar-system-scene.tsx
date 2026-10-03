import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
} from "react";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ControlsContext } from "@/components/system/camera-context";
import * as THREE from "three";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import {
  setResetCameraFn,
  setHorizCameraFn,
  setVertCameraFn,
  setAnimateToPosFn,
  setNavigateToKillFn,
} from "@/lib/camera-functions";
import { FloatingOriginController } from "./floating-origin-controller";
import { KeyboardCameraControls } from "./keyboard-camera-controls";
import { CameraMetricsUpdater } from "./camera-metrics-updater";
import { FrameStatsUpdater } from "@/components/common/frame-stats-updater";
import { ObjectLayer } from "./layers/objects/object-layer";
import { OrbitLayer } from "./layers/orbits/orbit-layer";
import { IconLayer } from "./layers/icons/icon-layer";
import { KillLayer } from "./layers/kills/kill-layer";
import { OffScreenIndicatorUpdater } from "./off-screen-indicator-updater";
import { SystemData } from "@/lib/schema/system-schema";
import {
  setCameraState,
  clearCameraState,
} from "@/stores/system/camera-state-store";

const FLOAT_THRESHOLD = 1_000_000 ** 2;
const INITIAL_CAMERA_AZIMUTH = 60;

interface SolarSystemSceneProps {
  slug: string;
  systemData: SystemData;
  farthest: number;
  initialControlsTarget: [number, number, number] | null;
  deepLinkKillId: number | null;
}

export function SolarSystemScene({
  slug,
  systemData,
  farthest,
  initialControlsTarget,
  deepLinkKillId,
}: SolarSystemSceneProps) {
  const { camera } = useThree();
  const orbitControlsRef = useRef<OrbitControlsImpl>(null!);

  const targetCameraPos = useRef(new THREE.Vector3());
  const targetControlsTarget = useRef(new THREE.Vector3());
  const [isAnimating, setAnimating] = useState(false);

  const markForRebase = useRef(false);
  const targetPhi = useRef<number | null>(null);
  const offsetRef = useRef(new THREE.Vector3());
  const sphRef = useRef(new THREE.Spherical());

  const groupRef = useRef(null!);

  const origin = useFloatingOriginStore((s) => s.origin);

  useLayoutEffect(() => {
    if (!initialControlsTarget) return;

    const controls = orbitControlsRef.current;
    if (!controls) return;

    controls.target.set(
      initialControlsTarget[0],
      initialControlsTarget[1],
      initialControlsTarget[2],
    );
    controls.update();

    markForRebase.current = true;
  }, [initialControlsTarget]);

  useFrame((state, delta) => {
    const controls = orbitControlsRef.current;
    if (!controls) return;

    const animating = isAnimating || targetPhi.current !== null;
    controls.enabled = !animating;
    controls.enableDamping = !animating;

    if (targetPhi.current !== null) {
      const offset = offsetRef.current.subVectors(
        camera.position,
        controls.target,
      );
      const sph = sphRef.current.setFromVector3(offset);
      const newPhi = THREE.MathUtils.damp(sph.phi, targetPhi.current, 8, delta);
      sph.phi = newPhi;
      offset.setFromSpherical(sph);
      camera.position.copy(controls.target).add(offset);
      controls.update();

      const cam = camera as THREE.PerspectiveCamera;
      const orbitDist = offset.length();
      const eps =
        ((2 * orbitDist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)) /
          state.size.height) *
        0.75;
      if (orbitDist * Math.abs(newPhi - targetPhi.current) < eps) {
        sph.phi = targetPhi.current;
        offset.setFromSpherical(sph);
        camera.position.copy(controls.target).add(offset);
        controls.update();
        targetPhi.current = null;
      }
      return;
    }

    if (!isAnimating) return;

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      targetCameraPos.current.x,
      8,
      delta,
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      targetCameraPos.current.y,
      8,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      targetCameraPos.current.z,
      8,
      delta,
    );

    controls.target.x = THREE.MathUtils.damp(
      controls.target.x,
      targetControlsTarget.current.x,
      8,
      delta,
    );
    controls.target.y = THREE.MathUtils.damp(
      controls.target.y,
      targetControlsTarget.current.y,
      8,
      delta,
    );
    controls.target.z = THREE.MathUtils.damp(
      controls.target.z,
      targetControlsTarget.current.z,
      8,
      delta,
    );

    controls.update();

    const distanceCamera = camera.position.distanceTo(targetCameraPos.current);
    const distanceTarget = controls.target.distanceTo(
      targetControlsTarget.current,
    );

    const cam = camera as THREE.PerspectiveCamera;
    const orbitDist = camera.position.distanceTo(controls.target);

    const unitsPerPixel =
      (2 * orbitDist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)) /
      state.size.height;

    const eps = unitsPerPixel * 0.75;

    if (distanceCamera < eps && distanceTarget < eps) {
      camera.position.copy(targetCameraPos.current);
      controls.target.copy(targetControlsTarget.current);
      controls.update();

      setAnimating(false);
    }
  });

  const animateTo = useCallback(
    (worldPosition: [number, number, number]) => {
      const controls = orbitControlsRef.current;
      if (!controls) return;

      const [ox, oy, oz] = useFloatingOriginStore.getState().origin;
      const localX = worldPosition[0] - ox;
      const localY = worldPosition[1] - oy;
      const localZ = worldPosition[2] - oz;

      const currentOffset = new THREE.Vector3().subVectors(
        camera.position,
        controls.target,
      );

      targetControlsTarget.current.set(localX, localY, localZ);
      targetCameraPos.current
        .copy(targetControlsTarget.current)
        .add(currentOffset);

      setAnimating(true);
      markForRebase.current = true;

      setCameraState({
        cameraPosition: [
          targetCameraPos.current.x + ox,
          targetCameraPos.current.y + oy,
          targetCameraPos.current.z + oz,
        ],
        controlsTarget: [
          targetControlsTarget.current.x + ox,
          targetControlsTarget.current.y + oy,
          targetControlsTarget.current.z + oz,
        ],
      });
    },
    [camera],
  );

  const resetCamera = useCallback(() => {
    const controls = orbitControlsRef.current;
    if (!controls) return;

    const [ox, oy, oz] = origin;
    const farthest = systemData.farthestObject;
    const radians = (INITIAL_CAMERA_AZIMUTH * Math.PI) / 180;
    const camY = farthest * 1.2 * Math.cos(radians);
    const camZ = farthest * 1.2 * Math.sin(radians);

    targetControlsTarget.current.set(-ox, -oy, -oz);
    targetCameraPos.current.set(0 - ox, camY - oy, -camZ - oz);

    setAnimating(true);
    markForRebase.current = true;

    clearCameraState();
  }, [origin, systemData.farthestObject]);

  useEffect(() => {
    setResetCameraFn(resetCamera);
    return () => setResetCameraFn(null);
  }, [resetCamera]);

  const horizCamera = useCallback(() => {
    setAnimating(false);
    targetPhi.current = Math.PI / 2;
  }, []);

  useEffect(() => {
    setHorizCameraFn(horizCamera);
    return () => setHorizCameraFn(null);
  }, [horizCamera]);

  const vertCamera = useCallback(() => {
    setAnimating(false);
    targetPhi.current = 1e-4;
  }, []);

  useEffect(() => {
    setVertCameraFn(vertCamera);
    return () => setVertCameraFn(null);
  }, [vertCamera]);

  const animateToPos = useCallback(
    (worldPosition: [number, number, number]) => {
      const controls = orbitControlsRef.current;
      if (!controls) return;

      const [ox, oy, oz] = origin;
      const localX = worldPosition[0] - ox;
      const localY = worldPosition[1] - oy;
      const localZ = worldPosition[2] - oz;

      const currentOffset = new THREE.Vector3().subVectors(
        camera.position,
        controls.target,
      );
      const targetDist = Math.min(currentOffset.length(), 20_000);
      const zoomedOffset = currentOffset.normalize().multiplyScalar(targetDist);

      targetControlsTarget.current.set(localX, localY, localZ);
      targetCameraPos.current
        .copy(targetControlsTarget.current)
        .add(zoomedOffset);

      setAnimating(true);
      markForRebase.current = true;

      setCameraState({
        cameraPosition: [
          targetCameraPos.current.x + ox,
          targetCameraPos.current.y + oy,
          targetCameraPos.current.z + oz,
        ],
        controlsTarget: [
          targetControlsTarget.current.x + ox,
          targetControlsTarget.current.y + oy,
          targetControlsTarget.current.z + oz,
        ],
      });
    },
    [camera, origin],
  );

  useEffect(() => {
    setAnimateToPosFn(animateToPos);
    return () => setAnimateToPosFn(null);
  }, [animateToPos]);

  const navigateToKill = useCallback(
    (worldPosition: [number, number, number]) => {
      const controls = orbitControlsRef.current;
      const group = groupRef.current as THREE.Group | null;
      if (!controls || !group) return;

      const { origin, shiftOrigin } = useFloatingOriginStore.getState();
      const [ox, oy, oz] = origin;
      const [wx, wy, wz] = worldPosition;

      const dx = wx - ox;
      const dy = wy - oy;
      const dz = wz - oz;
      const shift = new THREE.Vector3(dx, dy, dz);

      shiftOrigin([dx, dy, dz]);
      group.position.sub(shift);

      const radians = (INITIAL_CAMERA_AZIMUTH * Math.PI) / 180;
      const CLOSE_DISTANCE = 10_000;
      camera.position.set(
        0,
        Math.cos(radians) * CLOSE_DISTANCE,
        -Math.sin(radians) * CLOSE_DISTANCE,
      );
      controls.target.set(0, 0, 0);
      targetCameraPos.current.copy(camera.position);
      targetControlsTarget.current.set(0, 0, 0);

      markForRebase.current = false;
      controls.update();

      setCameraState({
        cameraPosition: [
          wx,
          wy + Math.cos(radians) * CLOSE_DISTANCE,
          wz - Math.sin(radians) * CLOSE_DISTANCE,
        ],
        controlsTarget: [wx, wy, wz],
      });
    },
    [camera],
  );

  useEffect(() => {
    setNavigateToKillFn(navigateToKill);
    return () => setNavigateToKillFn(null);
  }, [navigateToKill]);

  const handleEndInteraction = useCallback(
    (_: THREE.Event<string, unknown> | undefined) => {
      const controls = orbitControlsRef.current;
      if (!controls) return;

      setCameraState({
        cameraPosition: [
          camera.position.x + origin[0],
          camera.position.y + origin[1],
          camera.position.z + origin[2],
        ],
        controlsTarget: [
          controls.target.x + origin[0],
          controls.target.y + origin[1],
          controls.target.z + origin[2],
        ],
      });

      const shift = new THREE.Vector3(
        controls.target.x,
        controls.target.y,
        controls.target.z,
      );
      if (shift.lengthSq() < FLOAT_THRESHOLD) return;

      markForRebase.current = true;
    },
    [orbitControlsRef, camera, origin],
  );

  const controlsContextValue = useMemo(
    () => ({ controlsRef: orbitControlsRef, animateTo }),
    [animateTo],
  );

  return (
    <ControlsContext.Provider value={controlsContextValue}>
      <OrbitControls
        ref={orbitControlsRef}
        enableZoom
        enablePan
        enableRotate
        autoRotate={false}
        enableDamping={true}
        dampingFactor={0.03}
        zoomSpeed={3}
        maxDistance={farthest * 2}
        mouseButtons={{ LEFT: 0, MIDDLE: 1, RIGHT: 2 }}
        onEnd={handleEndInteraction}
      />
      <FloatingOriginController
        groupRef={groupRef}
        markForRebase={markForRebase}
        targetCameraPosRef={targetCameraPos}
        targetControlsTargetRef={targetControlsTarget}
      />
      <KeyboardCameraControls
        isAnimating={isAnimating}
        onMovementEnd={() => handleEndInteraction(undefined)}
      />
      <CameraMetricsUpdater />
      <FrameStatsUpdater />
      <group ref={groupRef}>
        <ObjectLayer systemData={systemData} />
        {systemData.planets && <OrbitLayer planetData={systemData.planets} />}
        <IconLayer systemData={systemData} />
      </group>
      <KillLayer
        slug={slug}
        systemData={systemData}
        deepLinkKillId={deepLinkKillId}
      />
      <OffScreenIndicatorUpdater />
    </ControlsContext.Provider>
  );
}
