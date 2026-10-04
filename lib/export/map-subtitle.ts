import {
  COLOR_MODE_OPTIONS,
  OVERLAY_MODE_OPTIONS,
  type ColorMode,
  type OverlayMode,
} from "@/lib/map/system-colors";

export function mapSubtitle(
  colorMode: ColorMode,
  overlay: OverlayMode,
): string | null {
  const parts: string[] = [];
  if (colorMode !== "none") {
    const mode = COLOR_MODE_OPTIONS.find((o) => o.value === colorMode);
    if (mode) parts.push(mode.label);
  }
  if (overlay !== "none") {
    const ov = OVERLAY_MODE_OPTIONS.find((o) => o.value === overlay);
    if (ov) parts.push(ov.label);
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}
