import { z } from "zod";
import type { FadeMode } from "@/lib/kill/fade-mode";

const ABSOLUTE_MIN_EPOCH = 1446508800;
const TOKEN_VERSION = 1;

export type PersistedTimeRangeLike = {
  start: number | null;
  end: number | "latest";
};

export interface SharedSettings {
  defaultColor?: string;
  killOpacity?: number;
  clusterColor?: string;
  clusterOpacity?: number;
  persistedTimeRange?: PersistedTimeRangeLike | null;
  deselectedTypeIds?: number[];
  showExcludedTypeIds?: number[];
  rangeSelected?: number | null;
  range?: number | null;
}

export interface SharedCamera {
  position: [number, number, number];
  target: [number, number, number];
}

export interface SharedPlayback {
  startTime: number;
  window: number;
  speed: number;
  fade: FadeMode;
  range: [number, number];
}

export interface SystemShare {
  settings?: SharedSettings;
  camera?: SharedCamera;
  playback?: SharedPlayback;
}

type PlaybackConfig = Omit<SharedPlayback, "startTime">;

interface ShareToken {
  v: number;
  settings?: SharedSettings;
  pb?: PlaybackConfig;
}

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

const PersistedTimeRangeLikeSchema: z.ZodType<PersistedTimeRangeLike> =
  z.object({
    start: z.number().nullable(),
    end: z.union([z.number(), z.literal("latest")]),
  });

const SharedSettingsSchema: z.ZodType<SharedSettings> = z.object({
  defaultColor: z.string().regex(HEX_COLOR).optional(),
  killOpacity: z.number().min(0).max(1).optional(),
  clusterColor: z.string().regex(HEX_COLOR).optional(),
  clusterOpacity: z.number().min(0).max(1).optional(),
  persistedTimeRange: PersistedTimeRangeLikeSchema.nullable().optional(),
  deselectedTypeIds: z.array(z.number().int()).optional(),
  showExcludedTypeIds: z.array(z.number().int()).optional(),
  rangeSelected: z.number().nullable().optional(),
  range: z.number().nullable().optional(),
});

const FadeModeSchema: z.ZodType<FadeMode> = z.enum(["always", "cap-triggered"]);

const PlaybackConfigSchema: z.ZodType<PlaybackConfig> = z.object({
  window: z.number(),
  speed: z.number(),
  fade: FadeModeSchema,
  range: z.tuple([z.number(), z.number()]),
});

const ShareTokenSchema: z.ZodType<ShareToken> = z.object({
  v: z.number(),
  settings: SharedSettingsSchema.optional(),
  pb: PlaybackConfigSchema.optional(),
});

function toBase64Url(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): string {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
}

export function encodeSystemShare(share: SystemShare): string {
  const params = new URLSearchParams();

  const token: ShareToken = { v: TOKEN_VERSION };
  if (share.settings && Object.keys(share.settings).length > 0)
    token.settings = share.settings;
  if (share.playback) {
    const { startTime, ...pb } = share.playback;
    token.pb = pb;
    params.set("t", String(Math.round(startTime)));
  }
  if (token.settings || token.pb) {
    params.set("s", toBase64Url(JSON.stringify(token)));
  }

  if (share.camera) {
    const p = share.camera.position;
    const t = share.camera.target;
    params.set(
      "cam",
      `${Math.round(p[0])},${Math.round(p[1])},${Math.round(p[2])}`,
    );
    params.set(
      "tgt",
      `${Math.round(t[0])},${Math.round(t[1])},${Math.round(t[2])}`,
    );
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function parseVec3(raw: string | null): [number, number, number] | null {
  if (!raw) return null;
  const parts = raw.split(",").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

export function decodeSystemShare(params: URLSearchParams): SystemShare {
  const out: SystemShare = {};

  let settings: SharedSettings | undefined;
  let pb: PlaybackConfig | undefined;
  const rawToken = params.get("s");
  if (rawToken) {
    try {
      const parsed: unknown = JSON.parse(fromBase64Url(rawToken));
      const result = ShareTokenSchema.safeParse(parsed);
      if (result.success && result.data.v === TOKEN_VERSION) {
        settings = result.data.settings;
        pb = result.data.pb;
      }
    } catch {
      // ignore
    }
  }
  if (settings) out.settings = settings;

  const pos = parseVec3(params.get("cam"));
  const tgt = parseVec3(params.get("tgt"));
  if (pos && tgt) out.camera = { position: pos, target: tgt };

  const tRaw = params.get("t");
  if (tRaw !== null && pb && Array.isArray(pb.range) && pb.range.length === 2) {
    const t = Number(tRaw);
    if (Number.isFinite(t)) {
      out.playback = {
        startTime: t,
        window: pb.window,
        speed: pb.speed,
        fade: pb.fade,
        range: [pb.range[0], pb.range[1]],
      };
    }
  }

  return out;
}

export interface ShareableSettingsInput {
  defaultColor: string;
  killOpacity: number;
  clusterColor: string;
  clusterOpacity: number;
  persistedTimeRange: PersistedTimeRangeLike | null;
  deselectedTypeIds: number[];
  showExcludedTypeIds: number[];
  rangeSelected: number | null;
  range: number | null;
}

export interface ShareableDefaults {
  defaultColor: string;
  killOpacity: number;
  clusterColor: string;
  clusterOpacity: number;
}

export function diffShareableSettings(
  cur: ShareableSettingsInput,
  def: ShareableDefaults,
): SharedSettings {
  const s: SharedSettings = {};
  if (cur.defaultColor !== def.defaultColor) s.defaultColor = cur.defaultColor;
  if (cur.killOpacity !== def.killOpacity) s.killOpacity = cur.killOpacity;
  if (cur.clusterColor !== def.clusterColor) s.clusterColor = cur.clusterColor;
  if (cur.clusterOpacity !== def.clusterOpacity)
    s.clusterOpacity = cur.clusterOpacity;
  if (cur.persistedTimeRange !== null)
    s.persistedTimeRange = cur.persistedTimeRange;
  if (cur.deselectedTypeIds.length > 0)
    s.deselectedTypeIds = cur.deselectedTypeIds;
  if (cur.showExcludedTypeIds.length > 0)
    s.showExcludedTypeIds = cur.showExcludedTypeIds;
  if (cur.rangeSelected !== null) s.rangeSelected = cur.rangeSelected;
  if (cur.range !== null) s.range = cur.range;
  return s;
}

export function clampStartTime(t: number, now: number): number {
  return Math.max(ABSOLUTE_MIN_EPOCH, Math.min(t, now));
}
