import { EXPORT_THEME, EXPORT_FONTS, TRACKING_WIDEST_EM } from "./export-theme";
import type { LegendSpec } from "./legend-spec";
import type { SystemHeaderSpec } from "./system-header";

export type PaintCtx = Pick<
  CanvasRenderingContext2D,
  | "font"
  | "fillStyle"
  | "strokeStyle"
  | "lineWidth"
  | "textAlign"
  | "textBaseline"
  | "globalAlpha"
  | "fillRect"
  | "strokeRect"
  | "fillText"
  | "measureText"
  | "createLinearGradient"
  | "drawImage"
>;

export interface PaintSize {
  width: number;
  height: number;
}

export type ExportOverlay =
  | { kind: "map"; legend: LegendSpec[]; scale: number }
  | {
      kind: "system";
      header: SystemHeaderSpec;
      timeLabel: string;
      scale: number;
      nameFont?: string;
    };

export const MARGIN = 16;
export const LEGEND_WIDTH = 200;
export const WATERMARK = "eve-killmap.com";

const PAD = 12;
const TITLE_LINE = 14;
const LABEL_LINE = 13;
const BAR_H = 8;
const SWATCH = 8;
const SWATCH_ROW = 14;
const BLOCK_GAP = 8;

export function wrapText(
  ctx: PaintCtx,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [text];
}

function blockHeight(
  ctx: PaintCtx,
  block: LegendSpec,
  innerWidthPx: number,
  s: number,
): number {
  ctx.font = `${12 * s}px ${EXPORT_FONTS.sans}`;
  let height = wrapText(ctx, block.title, innerWidthPx).length * TITLE_LINE * s;
  switch (block.type) {
    case "gradient":
      height += 4 * s + BAR_H * s + 4 * s + LABEL_LINE * s;
      break;
    case "swatches": {
      const rows = Math.ceil(block.entries.length / block.columns);
      height += 2 * s + rows * SWATCH_ROW * s;
      break;
    }
    case "text":
      if (block.note) {
        ctx.font = `${11 * s}px ${EXPORT_FONTS.sans}`;
        height +=
          wrapText(ctx, block.note, innerWidthPx).length * LABEL_LINE * s;
      }
      break;
  }
  return height;
}

function paintLegend(
  ctx: PaintCtx,
  size: PaintSize,
  legend: LegendSpec[],
  s: number,
) {
  const width = LEGEND_WIDTH * s;
  const inner = width - 2 * PAD * s;
  const contentH =
    legend.reduce((sum, b) => sum + blockHeight(ctx, b, inner, s), 0) +
    BLOCK_GAP * s * (legend.length - 1);
  const height = contentH + 2 * PAD * s;
  const x = MARGIN * s;
  const y = size.height - MARGIN * s - height;

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = EXPORT_THEME.panel;
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = EXPORT_THEME.border;
  ctx.lineWidth = 1 * s;
  ctx.strokeRect(x, y, width, height);

  let cy = y + PAD * s;
  const cx = x + PAD * s;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  for (const block of legend) {
    ctx.font = `${12 * s}px ${EXPORT_FONTS.sans}`;
    ctx.fillStyle = EXPORT_THEME.foreground;
    for (const line of wrapText(ctx, block.title, inner)) {
      ctx.fillText(line, cx, cy);
      cy += TITLE_LINE * s;
    }
    if (block.type === "gradient") {
      cy += 4 * s;
      const g = ctx.createLinearGradient(cx, 0, cx + inner, 0);
      block.stops.forEach((hex, i) =>
        g.addColorStop(
          block.stops.length === 1 ? 0 : i / (block.stops.length - 1),
          hex,
        ),
      );
      ctx.fillStyle = g;
      ctx.fillRect(cx, cy, inner, BAR_H * s);
      cy += (BAR_H + 4) * s;
      ctx.font = `${11 * s}px ${EXPORT_FONTS.mono}`;
      ctx.fillStyle = EXPORT_THEME.foregroundMuted;
      ctx.textAlign = "left";
      ctx.fillText(block.min, cx, cy);
      ctx.textAlign = "right";
      ctx.fillText(block.max, cx + inner, cy);
      ctx.textAlign = "left";
      cy += LABEL_LINE * s;
    } else if (block.type === "swatches") {
      cy += 2 * s;
      ctx.font = `${11 * s}px ${EXPORT_FONTS.sans}`;
      const columns = block.columns;
      const colW = inner / columns;
      block.entries.forEach((entry, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const ex = cx + col * colW;
        const ey = cy + row * SWATCH_ROW * s;
        ctx.fillStyle = entry.hex;
        ctx.fillRect(ex, ey + 2 * s, SWATCH * s, SWATCH * s);
        ctx.fillStyle = EXPORT_THEME.foregroundMuted;
        ctx.fillText(entry.label, ex + (SWATCH + 4) * s, ey);
      });
      cy += Math.ceil(block.entries.length / columns) * SWATCH_ROW * s;
    } else if (block.type === "text" && block.note) {
      ctx.font = `${11 * s}px ${EXPORT_FONTS.sans}`;
      ctx.fillStyle = EXPORT_THEME.foregroundMuted;
      for (const line of wrapText(ctx, block.note, inner)) {
        ctx.fillText(line, cx, cy);
        cy += LABEL_LINE * s;
      }
    }
    cy += BLOCK_GAP * s;
  }
}

interface Segment {
  text: string;
  font: string;
  color: string;
  letterSpacing?: string;
}

const NAME_GAP = 8;
const NAME_BASELINE = 24;
const NAME_LINE = 30;
const META_LINE = 16;
const FOCUS_ICON = 16;
const FOCUS_ICON_GAP = 6;

function setLetterSpacing(ctx: PaintCtx, value: string) {
  const c = ctx as { letterSpacing?: string };
  if ("letterSpacing" in c) c.letterSpacing = value;
}

function measureSegment(ctx: PaintCtx, seg: Segment): number {
  ctx.font = seg.font;
  setLetterSpacing(ctx, seg.letterSpacing ?? "0px");
  return ctx.measureText(seg.text).width;
}

function segmentsWidth(ctx: PaintCtx, segs: Segment[], gap: number): number {
  let w = 0;
  for (const seg of segs) w += measureSegment(ctx, seg);
  return w + gap * (segs.length - 1);
}

function paintSegments(
  ctx: PaintCtx,
  segs: Segment[],
  cx: number,
  baselineY: number,
  gap: number,
) {
  let x = cx - segmentsWidth(ctx, segs, gap) / 2;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  for (const seg of segs) {
    const w = measureSegment(ctx, seg);
    ctx.fillStyle = seg.color;
    ctx.fillText(seg.text, x, baselineY);
    x += w + gap;
  }
  setLetterSpacing(ctx, "0px");
}

function paintSystemHeader(
  ctx: PaintCtx,
  size: PaintSize,
  o: Extract<ExportOverlay, { kind: "system" }>,
  s: number,
) {
  const h = o.header;
  const nameFont = o.nameFont ?? `bold ${24 * s}px ${EXPORT_FONTS.sans}`;
  const metaFont = `${12 * s}px ${EXPORT_FONTS.sans}`;
  const metaSpacing = `${12 * s * TRACKING_WIDEST_EM}px`;

  const line1: Segment[] = [
    { text: h.name, font: nameFont, color: EXPORT_THEME.foreground },
  ];
  if (h.classLabel) {
    line1.push({
      text: h.classLabel,
      font: `600 ${16 * s}px ${EXPORT_FONTS.mono}`,
      color: h.classHex ?? EXPORT_THEME.foreground,
    });
    line1.push({
      text: h.securityLabel,
      font: `${12 * s}px ${EXPORT_FONTS.mono}`,
      color: h.securityHex,
    });
  } else {
    line1.push({
      text: h.securityLabel,
      font: `600 ${14 * s}px ${EXPORT_FONTS.mono}`,
      color: h.securityHex,
    });
  }

  const line2: Segment[] = [
    {
      text: `${h.constellation} · ${h.region}${h.effectLabel ? " · " : ""}`.toUpperCase(),
      font: metaFont,
      color: EXPORT_THEME.foregroundMuted,
      letterSpacing: metaSpacing,
    },
  ];
  if (h.effectLabel) {
    line2.push({
      text: h.effectLabel.toUpperCase(),
      font: metaFont,
      color: h.effectHex ?? EXPORT_THEME.foregroundMuted,
      letterSpacing: metaSpacing,
    });
  }
  const line3: Segment[] = [
    {
      text: h.connections.toUpperCase(),
      font: metaFont,
      color: EXPORT_THEME.foregroundMuted,
      letterSpacing: metaSpacing,
    },
  ];

  const focus = h.focus;
  const focusGap = 6 * s;
  const focusLabel: Segment[] = focus
    ? [
        {
          text: focus.kind === "centered" ? "CENTERED" : "NEAREST",
          font: metaFont,
          color: EXPORT_THEME.foregroundMuted,
          letterSpacing: metaSpacing,
        },
      ]
    : [];
  const focusName: Segment[] = focus
    ? [{ text: focus.name, font: metaFont, color: EXPORT_THEME.foreground }]
    : [];
  if (focus?.distanceLabel) {
    focusName.push({
      text: `· ${focus.distanceLabel}`,
      font: `${11 * s}px ${EXPORT_FONTS.mono}`,
      color: EXPORT_THEME.foregroundMuted,
    });
  }
  const labelW = focus ? segmentsWidth(ctx, focusLabel, 0) + focusGap : 0;
  const iconW = focus?.icon ? (FOCUS_ICON + FOCUS_ICON_GAP) * s : 0;
  const nameW = focus ? segmentsWidth(ctx, focusName, focusGap) : 0;
  const line4W = labelW + iconW + nameW;

  const widest = Math.max(
    segmentsWidth(ctx, line1, NAME_GAP * s),
    segmentsWidth(ctx, line2, 0),
    segmentsWidth(ctx, line3, 0),
    line4W,
  );
  const stripW = widest + 24 * s;
  const stripH = (NAME_LINE + META_LINE * (focus ? 3 : 2) + 16) * s;
  const cx = size.width / 2;
  const top = MARGIN * s;

  ctx.globalAlpha = 0.6;
  ctx.fillStyle = EXPORT_THEME.strip;
  ctx.fillRect(cx - stripW / 2, top, stripW, stripH);
  ctx.globalAlpha = 1;

  let baseline = top + (8 + NAME_BASELINE) * s;
  paintSegments(ctx, line1, cx, baseline, NAME_GAP * s);
  baseline += (NAME_LINE - NAME_BASELINE + 12) * s;
  paintSegments(ctx, line2, cx, baseline, 0);
  baseline += META_LINE * s;
  paintSegments(ctx, line3, cx, baseline, 0);
  if (focus) {
    baseline += META_LINE * s;
    let x = cx - line4W / 2;
    paintSegments(ctx, focusLabel, x + (labelW - focusGap) / 2, baseline, 0);
    x += labelW;
    if (focus.icon) {
      const iconPx = FOCUS_ICON * s;
      ctx.drawImage(focus.icon, x, baseline - 12 * s, iconPx, iconPx);
      x += iconW;
    }
    paintSegments(ctx, focusName, x + nameW / 2, baseline, focusGap);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function paintTimeCaption(
  ctx: PaintCtx,
  size: PaintSize,
  text: string,
  s: number,
) {
  ctx.font = `${11 * s}px ${EXPORT_FONTS.mono}`;
  ctx.fillStyle = EXPORT_THEME.foregroundMuted;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText(text, MARGIN * s, size.height - MARGIN * s);
  ctx.textBaseline = "alphabetic";
}

function paintWatermark(ctx: PaintCtx, size: PaintSize, s: number) {
  ctx.font = `${11 * s}px ${EXPORT_FONTS.sans}`;
  ctx.fillStyle = EXPORT_THEME.foreground;
  ctx.globalAlpha = 0.7;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(WATERMARK, size.width - MARGIN * s, size.height - MARGIN * s);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

export function paintOverlay(
  ctx: PaintCtx,
  size: PaintSize,
  overlay: ExportOverlay,
): void {
  const s = overlay.scale;
  if (overlay.kind === "map") {
    if (overlay.legend.length > 0) paintLegend(ctx, size, overlay.legend, s);
  } else {
    paintSystemHeader(ctx, size, overlay, s);
    paintTimeCaption(ctx, size, overlay.timeLabel, s);
  }
  paintWatermark(ctx, size, s);
}
