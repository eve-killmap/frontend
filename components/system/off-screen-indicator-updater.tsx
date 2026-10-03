import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useLocatedKillStore } from "@/stores/system/located-kill-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { offScreenIndicator } from "@/lib/system/off-screen-indicator-state";

const EDGE_MARGIN = 28;
const CENTER_PULL = 0.7;

export function OffScreenIndicatorUpdater() {
  const { camera, size } = useThree();
  const v = useRef(new THREE.Vector3());

  useFrame(() => {
    const pos = useLocatedKillStore.getState().position;
    if (!pos) {
      offScreenIndicator.visible = false;
      return;
    }

    const origin = useFloatingOriginStore.getState().origin;
    v.current
      .set(pos[0] - origin[0], pos[1] - origin[1], pos[2] - origin[2])
      .project(camera);
    const behind = v.current.z > 1;
    const onScreen =
      !behind && Math.abs(v.current.x) <= 1 && Math.abs(v.current.y) <= 1;
    if (onScreen) {
      offScreenIndicator.visible = false;
      return;
    }

    let dx = v.current.x,
      dy = v.current.y;
    if (behind) {
      dx = -dx;
      dy = -dy;
    }
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;

    const halfW = size.width / 2 - EDGE_MARGIN;
    const halfH = size.height / 2 - EDGE_MARGIN;
    const scale =
      Math.min(
        halfW / Math.max(Math.abs(dx), 1e-6),
        halfH / Math.max(Math.abs(dy), 1e-6),
      ) * CENTER_PULL;
    offScreenIndicator.x = size.width / 2 + dx * scale;
    offScreenIndicator.y = size.height / 2 - dy * scale;
    offScreenIndicator.angleDeg = (Math.atan2(-dy, dx) * 180) / Math.PI;
    offScreenIndicator.visible = true;
  });

  return null;
}
