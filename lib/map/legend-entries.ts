import { WORMHOLE_CLASS_HEX, wormholeEffectHex } from "@/lib/map/system-colors";
import { wormholeEffectLabel } from "@/lib/map/wormhole";

export const WORMHOLE_CLASS_LEGEND: { label: string; hex: string }[] = [
  { label: "C1", hex: WORMHOLE_CLASS_HEX[1] },
  { label: "C2", hex: WORMHOLE_CLASS_HEX[2] },
  { label: "C3", hex: WORMHOLE_CLASS_HEX[3] },
  { label: "C4", hex: WORMHOLE_CLASS_HEX[4] },
  { label: "C5", hex: WORMHOLE_CLASS_HEX[5] },
  { label: "C6", hex: WORMHOLE_CLASS_HEX[6] },
  { label: "C13", hex: WORMHOLE_CLASS_HEX[13] },
  { label: "Thera / Drifter", hex: WORMHOLE_CLASS_HEX[12] },
];

export const WORMHOLE_EFFECT_LEGEND: { label: string; hex: string }[] = [
  ...[1, 2, 3, 4, 5, 6].map((id) => ({
    label: wormholeEffectLabel(id) as string,
    hex: wormholeEffectHex(id),
  })),
  { label: "None", hex: "#808080" },
];
