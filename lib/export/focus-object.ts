import type { SystemData, TypeRadiiData } from "@/lib/schema/system-schema";
import { findNearestObject } from "@/lib/system/find-nearest-object";
import { getLabel } from "@/stores/system/system-object-name-store";
import type { RegisteredIcon } from "@/stores/system/icon-store";

export type FocusIcon = RegisteredIcon;

export interface FocusObject {
  kind: "centered" | "nearest";
  id: number | null;
  iconID: number | null;
  name: string;
  distance?: number;
}

export const CENTERED_TOLERANCE_M = 1000;

export function resolveFocusObject(
  target: [number, number, number],
  icons: readonly FocusIcon[],
  systemData: SystemData,
  typeRadii: TypeRadiiData,
): FocusObject | null {
  let hit: FocusIcon | null = null;
  let hitDist = CENTERED_TOLERANCE_M;
  for (const icon of icons) {
    const [x, y, z] = icon.position;
    const d = Math.sqrt(
      (target[0] - x) ** 2 + (target[1] - y) ** 2 + (target[2] - z) ** 2,
    );
    if (d <= hitDist) {
      hit = icon;
      hitDist = d;
    }
  }
  if (hit) {
    return {
      kind: "centered",
      id: hit.id,
      iconID: hit.iconID,
      name: getLabel(hit.id),
    };
  }
  const near = findNearestObject(target, systemData, typeRadii);
  if (!near) return null;
  const icon =
    near.id === null ? undefined : icons.find((i) => i.id === near.id);
  return {
    kind: "nearest",
    id: near.id,
    iconID: icon?.iconID ?? null,
    name: near.name,
    distance: near.distance,
  };
}
