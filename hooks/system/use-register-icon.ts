import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useIconLayoutStore } from "@/stores/system/icon-layout-store";

export function useRegisterIcon(params: {
  id: number;
  position: [number, number, number];
  priority: number;
}) {
  const register = useIconLayoutStore((s) => s.register);

  const posRef = useRef(params.position);
  posRef.current = params.position;

  const getWorldPos = useMemo(() => {
    return (out: THREE.Vector3) =>
      out.set(posRef.current[0], posRef.current[1], posRef.current[2]);
  }, []);

  useEffect(() => {
    return register({
      id: params.id,
      getWorldPos,
      priority: params.priority,
    });
  }, [register, params.id, params.priority, getWorldPos]);
}
