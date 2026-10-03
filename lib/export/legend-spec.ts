import {
  ColorMode,
  OverlayMode,
  SECURITY_HEX,
  ACTIVITY_HEX,
  JUMPS_HEX,
  HOT_HEX,
} from "@/lib/map/system-colors";
import {
  WORMHOLE_CLASS_LEGEND,
  WORMHOLE_EFFECT_LEGEND,
} from "@/lib/map/legend-entries";

export type LegendSpec =
  | {
      type: "gradient";
      title: string;
      stops: readonly string[];
      min: string;
      max: string;
    }
  | {
      type: "swatches";
      title: string;
      entries: { label: string; hex: string }[];
      columns: 1 | 2;
    }
  | { type: "text"; title: string; note?: string };

export interface LegendInput {
  effectiveMode: ColorMode;
  overlay: OverlayMode;
  activityMax: number | null;
  activityError: boolean;
  activityRangeLabel: string;
  filterActive: boolean;
  jumpsMax: number | null;
  jumpsError: boolean;
  hotMax: number;
  hotFloor: number;
  admAvailable: boolean | null;
}

function maxLabel(max: number | null, error: boolean): string {
  if (max !== null) return max.toLocaleString();
  return error ? "-" : "…";
}

function assertNever(x: never): never {
  throw new Error(`Unhandled colour mode: ${String(x)}`);
}

export function legendSpecFor(input: LegendInput): LegendSpec[] {
  const out: LegendSpec[] = [];
  switch (input.effectiveMode) {
    case "security":
      out.push({
        type: "gradient",
        title: "Security status",
        stops: SECURITY_HEX,
        min: "-1.0",
        max: "1.0",
      });
      break;
    case "activity":
      out.push({
        type: "gradient",
        title: `${input.filterActive ? "Kills matching filter" : "Kills"} (${input.activityRangeLabel})`,
        stops: ACTIVITY_HEX,
        min: "0",
        max: maxLabel(input.activityMax, input.activityError),
      });
      break;
    case "jumps":
      out.push({
        type: "gradient",
        title: "Ship jumps (past hour)",
        stops: JUMPS_HEX,
        min: "0",
        max: maxLabel(input.jumpsMax, input.jumpsError),
      });
      break;
    case "region":
      out.push({ type: "text", title: "Colored by region" });
      break;
    case "sovereignty":
      out.push({ type: "text", title: "Colored by sovereignty" });
      break;
    case "wormhole-class":
      out.push({
        type: "swatches",
        title: "Wormhole class",
        entries: WORMHOLE_CLASS_LEGEND,
        columns: 2,
      });
      break;
    case "wormhole-effect":
      out.push({
        type: "swatches",
        title: "Wormhole effect",
        entries: WORMHOLE_EFFECT_LEGEND,
        columns: 1,
      });
      break;
    case "none":
      break;
    default:
      assertNever(input.effectiveMode);
  }
  if (input.overlay === "sovereignty") {
    out.push({
      type: "text",
      title: "Sovereignty overlay",
      ...(input.admAvailable === false
        ? {
            note: "ADM data unavailable, so territory sizes reflect system count only.",
          }
        : {}),
    });
  } else if (input.overlay === "hot") {
    out.push({
      type: "gradient",
      title: "Hot areas, kills in the last hour",
      stops: HOT_HEX,
      min: "0",
      max: Math.max(input.hotMax, input.hotFloor).toLocaleString(),
    });
  }
  return out;
}
