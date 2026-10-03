export type ColorMode =
  | "none"
  | "security"
  | "activity"
  | "jumps"
  | "region"
  | "sovereignty"
  | "wormhole-class"
  | "wormhole-effect";

export const COLOR_MODE_MAP_TYPE: Partial<Record<ColorMode, string>> = {
  sovereignty: "new-eden",
  jumps: "new-eden",
  "wormhole-class": "anoikis",
  "wormhole-effect": "anoikis",
};

export function colorModeAllowedOn(mode: ColorMode, mapType: string): boolean {
  const required = COLOR_MODE_MAP_TYPE[mode];
  return !required || required === mapType;
}

export type OverlayMode = "none" | "sovereignty" | "hot";

export const OVERLAY_MAP_TYPE: Partial<Record<OverlayMode, string>> = {
  sovereignty: "new-eden",
};

export function overlayAllowedOn(mode: OverlayMode, mapType: string): boolean {
  const required = OVERLAY_MAP_TYPE[mode];
  return !required || required === mapType;
}

export const COLOR_MODE_OPTIONS: { value: ColorMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "security", label: "Security" },
  { value: "activity", label: "Kill Activity" },
  { value: "jumps", label: "Ship Jumps" },
  { value: "region", label: "Region" },
  { value: "sovereignty", label: "Sovereignty" },
  { value: "wormhole-class", label: "Wormhole Class" },
  { value: "wormhole-effect", label: "Wormhole Effect" },
];

export const OVERLAY_MODE_OPTIONS: { value: OverlayMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "sovereignty", label: "Sovereignty" },
  { value: "hot", label: "Hot Areas" },
];

export type RGB = [number, number, number];

export const BASE_GRAY: RGB = toLinear(hexToRgb("#808080"));

export const SECURITY_HEX = [
  "#8d3163",
  "#731f1f",
  "#bb1116",
  "#ce440f",
  "#dc6c06",
  "#f5ff83",
  "#71e754",
  "#60dba3",
  "#4ecef8",
  "#399aeb",
  "#2c75e1",
] as const;
const SECURITY_RGB: RGB[] = SECURITY_HEX.map((h) => toLinear(hexToRgb(h)));

const RAMP_ZERO: RGB = toLinear(hexToRgb("#4d4d4d"));

export const ACTIVITY_HEX = [
  "#3a2a6b",
  "#8b2f8f",
  "#d64562",
  "#f5883a",
  "#ffe070",
] as const;

const ACTIVITY_TS = [0, 0.25, 0.5, 0.75, 1];
const ACTIVITY_STOPS: { t: number; rgb: RGB }[] = ACTIVITY_HEX.map((h, i) => ({
  t: ACTIVITY_TS[i],
  rgb: toLinear(hexToRgb(h)),
}));

export const JUMPS_HEX = [
  "#0d3b4a",
  "#127d8f",
  "#22b8cf",
  "#7ce8f5",
  "#eafdff",
] as const;

const JUMPS_STOPS: { t: number; rgb: RGB }[] = JUMPS_HEX.map((h, i) => ({
  t: ACTIVITY_TS[i],
  rgb: toLinear(hexToRgb(h)),
}));

export const HOT_HEX = ["#7a1f00", "#ff6a00", "#ffb347", "#fff4d6"] as const;

const HOT_TS = [0, 1 / 3, 2 / 3, 1];
const HOT_STOPS: { t: number; rgb: RGB }[] = HOT_HEX.map((h, i) => ({
  t: HOT_TS[i],
  rgb: toLinear(hexToRgb(h)),
}));

export function hotRampColor(t: number): RGB {
  return rampColor(HOT_STOPS, clamp01(t));
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex(rgb: RGB): string {
  const h = (c: number) =>
    Math.round(Math.max(0, Math.min(1, c)) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${h(rgb[0])}${h(rgb[1])}${h(rgb[2])}`;
}

export function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function toLinear(rgb: RGB): RGB {
  return [srgbToLinear(rgb[0]), srgbToLinear(rgb[1]), srgbToLinear(rgb[2])];
}

export function roundSecurity(sec: number): number {
  if (sec > 0 && sec < 0.05) return 0.1;
  return Math.round(sec * 10) / 10 || 0;
}

export function securityIndex(sec: number): number {
  if (!Number.isFinite(sec) || sec <= 0) return 0;
  return Math.min(10, Math.round(roundSecurity(sec) * 10));
}

export function securityColor(sec: number): RGB {
  return SECURITY_RGB[securityIndex(sec)];
}

export function formatSecurity(sec: number): string {
  return roundSecurity(sec).toFixed(1);
}

function logRampColor(
  stops: { t: number; rgb: RGB }[],
  count: number,
  max: number,
): RGB {
  if (count <= 0) return RAMP_ZERO;
  const t = max <= 0 ? 0 : Math.log(count + 1) / Math.log(max + 1);
  return rampColor(stops, clamp01(t));
}

export function activityColor(count: number, maxCount: number): RGB {
  return logRampColor(ACTIVITY_STOPS, count, maxCount);
}

export function jumpsColor(count: number, maxCount: number): RGB {
  return logRampColor(JUMPS_STOPS, count, maxCount);
}

export function regionColor(regionID: number): RGB {
  const hue = (((regionID * 137.508) % 360) + 360) % 360;
  return toLinear(hslToRgb(hue, 0.6, 0.6));
}

export const WORMHOLE_CLASS_HEX: Record<number, string> = {
  1: "#5252ff",
  2: "#00a8a8",
  3: "#00a800",
  4: "#a8a800",
  5: "#a85400",
  6: "#a80000",
  12: "#ffffff",
  13: "#a800a8",
  14: "#ffffff",
  15: "#ffffff",
  16: "#ffffff",
  17: "#ffffff",
  18: "#ffffff",
};

const WORMHOLE_CLASS_RGB: Record<number, RGB> = Object.fromEntries(
  Object.entries(WORMHOLE_CLASS_HEX).map(
    ([id, hex]) => [Number(id), toLinear(hexToRgb(hex))] as [number, RGB],
  ),
);

export function wormholeClassColor(classID: number): RGB {
  return WORMHOLE_CLASS_RGB[classID] ?? BASE_GRAY;
}

function effectSrgb(effectID: number): RGB {
  const hue = (((effectID * 137.508) % 360) + 360) % 360;
  return hslToRgb(hue, 0.6, 0.6);
}

export function wormholeEffectColor(effectID: number): RGB {
  return effectID > 0 ? toLinear(effectSrgb(effectID)) : BASE_GRAY;
}

export function wormholeEffectHex(effectID: number): string {
  return effectID > 0 ? rgbToHex(effectSrgb(effectID)) : "#808080";
}

export interface ActivityLookup {
  countFor: (systemID: number) => number;
  max: number;
  total: number;
}

export interface BuildColorsParams {
  mode: ColorMode;
  systemIDs: number[];
  securityStatuses?: number[];
  regionIDByIndex?: (i: number) => number | undefined;
  activity?: ActivityLookup | null;
  jumps?: ActivityLookup | null;
  sovColorFor?: (systemID: number) => RGB | undefined;
  wormholeClassIDs?: number[];
  wormholeEffects?: number[];
}

export function buildSystemColors(params: BuildColorsParams): Float32Array {
  const {
    mode,
    systemIDs,
    securityStatuses,
    regionIDByIndex,
    activity,
    jumps,
    sovColorFor,
    wormholeClassIDs,
    wormholeEffects,
  } = params;
  const n = systemIDs.length;
  const out = new Float32Array(n * 3);

  for (let i = 0; i < n; i++) {
    let rgb: RGB = BASE_GRAY;
    if (mode === "security" && securityStatuses) {
      rgb = securityColor(securityStatuses[i]);
    } else if (mode === "region" && regionIDByIndex) {
      const regionID = regionIDByIndex(i);
      rgb = regionID === undefined ? BASE_GRAY : regionColor(regionID);
    } else if (mode === "activity" && activity) {
      rgb = activityColor(activity.countFor(systemIDs[i]), activity.max);
    } else if (mode === "jumps" && jumps) {
      rgb = jumpsColor(jumps.countFor(systemIDs[i]), jumps.max);
    } else if (mode === "sovereignty" && sovColorFor) {
      rgb = sovColorFor(systemIDs[i]) ?? BASE_GRAY;
    } else if (mode === "wormhole-class" && wormholeClassIDs) {
      rgb = wormholeClassColor(wormholeClassIDs[i]);
    } else if (mode === "wormhole-effect" && wormholeEffects) {
      rgb = wormholeEffectColor(wormholeEffects[i]);
    }
    out[i * 3] = rgb[0];
    out[i * 3 + 1] = rgb[1];
    out[i * 3 + 2] = rgb[2];
  }
  return out;
}

function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rampColor(stops: { t: number; rgb: RGB }[], t: number): RGB {
  if (t <= stops[0].t) return stops[0].rgb;
  const last = stops[stops.length - 1];
  if (t >= last.t) return last.rgb;
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i].t) {
      const a = stops[i - 1];
      const b = stops[i];
      const f = (t - a.t) / (b.t - a.t);
      return [
        lerp(a.rgb[0], b.rgb[0], f),
        lerp(a.rgb[1], b.rgb[1], f),
        lerp(a.rgb[2], b.rgb[2], f),
      ];
    }
  }
  return last.rgb;
}

function hslToRgb(h: number, s: number, l: number): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0,
    g = 0,
    b = 0;
  if (hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}
