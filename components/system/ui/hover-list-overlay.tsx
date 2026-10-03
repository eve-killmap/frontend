import { Html } from "@react-three/drei";
import { RefObject, useContext, useEffect, useMemo, useRef } from "react";
import { useHoverListStore } from "@/stores/system/hover-list-store";
import { useHidden } from "@/stores/system/hidden-store";
import { getIconsByIDs } from "@/stores/system/icon-store";
import { getIconURL } from "@/lib/eve/icon-url";
import { ControlsContext } from "@/components/system/camera-context";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { getLabel } from "@/stores/system/system-object-name-store";

export function HoverListOverlay() {
  const controlsRef = useContext(ControlsContext);

  const activeId = useHoverListStore((s) => s.activeId);
  const anchor = useHoverListStore((s) => s.anchor);
  const clear = useHoverListStore((s) => s.clear);
  const cancelClear = useHoverListStore((s) => s.cancelClear);

  const hiddenIDs = useHidden(activeId ?? -1);
  const hiddenIcons = useMemo(() => {
    if (activeId == null) return [];

    return getIconsByIDs(hiddenIDs);
  }, [activeId, hiddenIDs]);

  const cardRef = useRef<HTMLDivElement | null>(null!);

  const overlayGroupRef = useRef<THREE.Group>(null!);

  useWorldPosWithScreenOffsetIntoRef(overlayGroupRef, anchor, [-12, 16]);

  useEffect(() => {
    if (activeId == null) return;

    const onPointerDownCapture = (e: PointerEvent) => {
      const el = cardRef.current;
      if (!el) return;
      if (el.contains(e.target as Node)) return;
      clear();
    };

    document.addEventListener("pointerdown", onPointerDownCapture, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDownCapture, true);
  }, [activeId, clear]);

  if (activeId == null || hiddenIcons.length === 0) return null;

  return (
    <group ref={overlayGroupRef}>
      <Html style={{ pointerEvents: "auto" }} zIndexRange={[900, 0]}>
        <div
          ref={cardRef}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onMouseEnter={() => cancelClear()}
          onMouseLeave={() => clear()}
          className="inline-block w-max max-w-[90vw] bg-panel text-foreground border border-border overflow-hidden select-none"
        >
          <div className="px-2 py-1 text-xs text-fg-secondary border-b border-border whitespace-nowrap">
            Hidden ({hiddenIcons.length})
          </div>

          <ul className="max-h-56 overflow-auto w-max">
            {hiddenIcons.map((icon) => (
              <li
                key={icon.id}
                className="flex flex-nowrap items-center gap-2 px-2 py-1 border-b last:border-b-0 cursor-pointer hover:bg-panel-elevated whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  controlsRef?.animateTo(icon.position);
                  clear();
                }}
              >
                <img
                  src={getIconURL(icon.iconID)}
                  className="h-4 w-4 opacity-90"
                  alt=""
                />
                <span className="pr-1 text-sm leading-none whitespace-nowrap">
                  {getLabel(icon.id)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Html>
    </group>
  );
}

type Vec3 = [number, number, number];

function useWorldPosWithScreenOffsetIntoRef(
  outRef: RefObject<THREE.Group>,
  anchorWorld: Vec3,
  offsetPx: [number, number],
) {
  const { camera, size } = useThree();
  const origin = useFloatingOriginStore((s) => s.origin);

  const tmpAnchorR = useRef(new THREE.Vector3());
  const tmpNdc = useRef(new THREE.Vector3());

  useFrame(() => {
    const obj = outRef.current;
    if (!obj) return;

    tmpAnchorR.current.set(
      anchorWorld[0] - origin[0],
      anchorWorld[1] - origin[1],
      anchorWorld[2] - origin[2],
    );

    tmpNdc.current.copy(tmpAnchorR.current).project(camera);

    const [dxPx, dyPx] = offsetPx;
    const dxNdc = (dxPx / size.width) * 2;
    const dyNdc = (dyPx / size.height) * 2;

    tmpNdc.current.x += dxNdc;
    tmpNdc.current.y -= dyNdc;

    tmpNdc.current.unproject(camera);

    obj.position.set(
      tmpNdc.current.x + origin[0],
      tmpNdc.current.y + origin[1],
      tmpNdc.current.z + origin[2] + 0.002,
    );
  });
}
