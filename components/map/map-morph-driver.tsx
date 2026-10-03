import { useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useMapStore } from "@/stores/map/map-store";
import { mapMorphState, initMapMorph } from "@/lib/map/map-morph-state";
import { smoothstep, stepToward, lerpPositionsInto } from "@/lib/map/map-morph";

export const MORPH_DURATION_SECONDS = 0.6;

export interface MorphBuffer {
  a: Float32Array;
  b: Float32Array;
  out: Float32Array;
}

export function MapMorphDriver({ buffers }: { buffers: MorphBuffer[] }) {
  const show3D = useMapStore((s) => s.show3D);
  const setMorphActive = useMapStore((s) => s.setMorphActive);
  const mounted = useRef(false);

  useLayoutEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      initMapMorph(show3D);
      setMorphActive(false);
      return;
    }
    mapMorphState.target = show3D ? 1 : 0;
    if (mapMorphState.t !== mapMorphState.target) {
      mapMorphState.morphing = true;
      setMorphActive(true);
    }
  }, [show3D, setMorphActive]);

  useEffect(() => () => setMorphActive(false), [setMorphActive]);

  useFrame((_, delta) => {
    if (!mapMorphState.morphing) return;
    const next = stepToward(
      mapMorphState.t,
      mapMorphState.target,
      delta,
      MORPH_DURATION_SECONDS,
    );
    mapMorphState.t = next;
    const e = smoothstep(next);
    for (const buf of buffers) lerpPositionsInto(buf.a, buf.b, e, buf.out);
    if (next === mapMorphState.target) {
      mapMorphState.morphing = false;
      setMorphActive(false);
    }
  });

  return null;
}
