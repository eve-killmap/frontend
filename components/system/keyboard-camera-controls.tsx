import { useContext, useEffect, useRef } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ControlsContext } from "@/components/system/camera-context";

const UP = new THREE.Vector3(0, 1, 0);

const MOVEMENT_KEYS = new Set([
  "w",
  "s",
  "a",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
]);

interface KeyboardCameraControlsProps {
  isAnimating: boolean;
  onMovementEnd: () => void;
}

export function KeyboardCameraControls({
  isAnimating,
  onMovementEnd,
}: KeyboardCameraControlsProps) {
  const { camera } = useThree();
  const ctx = useContext(ControlsContext);
  const keysRef = useRef(new Set<string>());
  const wasMovingRef = useRef(false);
  const forwardRef = useRef(new THREE.Vector3());
  const rightRef = useRef(new THREE.Vector3());
  const moveRef = useRef(new THREE.Vector3());

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const key = e.key.toLowerCase();
      if (!MOVEMENT_KEYS.has(key)) return;

      e.preventDefault();
      keysRef.current.add(key);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.delete(key);

      if (wasMovingRef.current && keysRef.current.size === 0) {
        wasMovingRef.current = false;
        onMovementEnd();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [onMovementEnd]);

  useFrame((_, delta) => {
    const controls = ctx?.controlsRef.current;
    if (!controls || isAnimating) return;

    const keys = keysRef.current;
    if (keys.size === 0) return;

    wasMovingRef.current = true;

    const forward = forwardRef.current;
    camera.getWorldDirection(forward);
    forward.y = 0;

    if (forward.lengthSq() < 0.0001) {
      forward
        .set(camera.matrix.elements[8], 0, camera.matrix.elements[10])
        .negate();
    }
    forward.normalize();

    const right = rightRef.current;
    right.crossVectors(forward, UP).normalize();

    const distance = camera.position.distanceTo(controls.target);
    const speed = distance * delta;

    const move = moveRef.current.set(0, 0, 0);
    if (keys.has("w") || keys.has("arrowup"))
      move.addScaledVector(forward, speed);
    if (keys.has("s") || keys.has("arrowdown"))
      move.addScaledVector(forward, -speed);
    if (keys.has("a") || keys.has("arrowleft"))
      move.addScaledVector(right, -speed);
    if (keys.has("d") || keys.has("arrowright"))
      move.addScaledVector(right, speed);

    camera.position.add(move);
    controls.target.add(move);
    controls.update();
  });

  return null;
}
