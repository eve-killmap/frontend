import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useObjectLodStore } from "../../stores/system/object-lod-store";

export function useRegisterObject(params: {
  id: number;
  position: [number, number, number];
  worldRadius: number;
  minPixelRadius: number;
  hysteresisPx?: number;
}) {
  const register = useObjectLodStore((s) => s.register);

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
      worldRadius: params.worldRadius,
      minPixelRadius: params.minPixelRadius,
      hysteresisPx: params.hysteresisPx ?? 1,
    });
  }, [
    register,
    params.id,
    getWorldPos,
    params.worldRadius,
    params.minPixelRadius,
    params.hysteresisPx,
  ]);
}
