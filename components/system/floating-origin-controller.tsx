import { RefObject, useContext, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { ControlsContext } from "@/components/system/camera-context";

type FloatingOriginControllerProps = {
  groupRef: RefObject<THREE.Group | null>;
  markForRebase: RefObject<boolean>;
  threshold?: number;
  targetCameraPosRef?: RefObject<THREE.Vector3>;
  targetControlsTargetRef?: RefObject<THREE.Vector3>;
};

export function FloatingOriginController({
  groupRef,
  markForRebase,
  targetCameraPosRef,
  targetControlsTargetRef,
}: FloatingOriginControllerProps) {
  const { camera } = useThree();
  const controlsRef = useContext(ControlsContext);

  const shiftOrigin = useFloatingOriginStore((s) => s.shiftOrigin);

  const lastTarget = useRef(new THREE.Vector3());
  const stableFrames = useRef(0);

  useFrame(() => {
    if (markForRebase.current) {
      const controls = controlsRef?.controlsRef.current;
      if (!controls) return;

      const d = lastTarget.current.distanceToSquared(controls.target);
      lastTarget.current.copy(controls.target);

      if (d < 1e-6) {
        if (stableFrames.current < 10) {
          stableFrames.current += 1;
          return;
        }
      } else return;

      stableFrames.current = 0;

      const dx = lastTarget.current.x;
      const dy = lastTarget.current.y;
      const dz = lastTarget.current.z;

      shiftOrigin([dx, dy, dz]);

      camera.position.sub(lastTarget.current);
      controls.target.sub(lastTarget.current);

      if (groupRef.current) groupRef.current.position.sub(lastTarget.current);

      targetCameraPosRef?.current?.sub(lastTarget.current);
      targetControlsTargetRef?.current?.sub(lastTarget.current);

      controls.update();

      markForRebase.current = false;
    }
  }, -20);

  return null;
}
