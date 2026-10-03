import { smoothstep } from "@/lib/map/map-morph";

export const VERITE_M_PER_PX = 4.8445284569785e17 / 1014;
export const AU_METERS = 1.496e11;
export const AU_PER_IU_3D = VERITE_M_PER_PX / AU_METERS;
export const U2D_STARGATE_RATIO = 43428 / 44778;
export const AU_PER_IU_2D = AU_PER_IU_3D * U2D_STARGATE_RATIO;

export const INSENSITIVITY = 500;
export const R_IU = 400;
export const R2_IU = R_IU * R_IU;
export const VALIDINF = 0.023;

export const ALPHA_MAX = 190;
export const BORDER_ALPHA = 72;
export const ALPHA_LOG_SCALE = 700;

export const DEPTH_SCALE = 64.0;
export const FIELD_PAD_IU = R_IU;
export const FIELD_TARGET_MAX = 2048;
export const MIN_FIELD_AXIS_IU = 1000;
export const OWNERSHIP_GRID_SIZE = 512;

export const SEED_HIGH_ADM = 6.0;
export const SEED_HIGH_WEIGHT = 60.0;
export const SEED_HIGH_HOPS = 3;
export const SEED_LOW_PER_ADM = 5.0;
export const SEED_LOW_HOPS = 2;
export const W_NPC = 30.0;
export const NPC_HOPS = 2;
export const DECAY = 0.3;
export const SEC_SEED_EXCLUDE = 0.05;

export const KIND_ALLIANCE = 0;
export const KIND_CORP = 1;
export const KIND_FACTION = 2;

export interface KernelSource {
  x: number;
  y: number;
  weight: number;
}

export function influenceAt(
  sources: KernelSource[],
  px: number,
  py: number,
): number {
  let sum = 0;
  for (const s of sources) {
    const dx = px - s.x;
    const dy = py - s.y;
    const d2 = dx * dx + dy * dy;
    if (d2 > R2_IU) continue;
    sum += s.weight / (INSENSITIVITY + d2);
  }
  return sum;
}

export function alphaFor(I: number): number {
  const a = Math.log(Math.log(I + 1.0) + 1.0) * ALPHA_LOG_SCALE;
  return Math.min(ALPHA_MAX, a);
}

export function auPerIu(morphT: number): number {
  const e = smoothstep(morphT);
  return AU_PER_IU_2D + (AU_PER_IU_3D - AU_PER_IU_2D) * e;
}
