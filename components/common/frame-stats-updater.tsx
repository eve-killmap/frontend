import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { frameStatsReset, frameStatsTick } from "@/lib/frame-stats";

export function FrameStatsUpdater() {
  const { gl } = useThree();

  useEffect(() => {
    frameStatsReset();
    return frameStatsReset;
  }, []);

  useFrame(() => frameStatsTick(performance.now(), gl.info), -20);

  return null;
}
