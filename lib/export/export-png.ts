import { captureFrameFn, type CaptureFrameFn } from "./capture-functions";
import { downloadBlob } from "./download";
import { EXPORT_THEME, EXPORT_FONTS } from "./export-theme";
import { paintOverlay, type ExportOverlay } from "./paint-overlay";

async function ensureExportFonts(overlay: ExportOverlay): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  const specs = [
    `bold 24px ${EXPORT_FONTS.sans}`,
    `12px ${EXPORT_FONTS.sans}`,
    `bold 14px ${EXPORT_FONTS.mono}`,
    `11px ${EXPORT_FONTS.mono}`,
  ];
  if (overlay.kind === "system" && overlay.nameFont)
    specs.push(overlay.nameFont);
  await Promise.all(
    specs.map((spec) => document.fonts.load(spec).catch(() => undefined)),
  );
}

export interface ExportPngDeps {
  capture: CaptureFrameFn | null;
  compose: (frame: Blob, overlay: ExportOverlay) => Promise<Blob>;
  download: (blob: Blob, filename: string) => void;
}

export async function composeInBrowser(
  frame: Blob,
  overlay: ExportOverlay,
): Promise<Blob> {
  await ensureExportFonts(overlay);
  const bitmap = await createImageBitmap(frame);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not create a 2D canvas");
    ctx.fillStyle = EXPORT_THEME.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    paintOverlay(ctx, { width: canvas.width, height: canvas.height }, overlay);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) =>
          b ? resolve(b) : reject(new Error("Compose produced no image")),
        "image/png",
      ),
    );
  } finally {
    bitmap.close();
  }
}

function browserDeps(): ExportPngDeps {
  return {
    capture: captureFrameFn,
    compose: composeInBrowser,
    download: downloadBlob,
  };
}

export async function exportPng(
  overlay: ExportOverlay,
  filename: string,
  deps: ExportPngDeps = browserDeps(),
): Promise<void> {
  if (!deps.capture) throw new Error("Scene not ready");
  const frame = await deps.capture(overlay.scale);
  const composed = await deps.compose(frame, overlay);
  deps.download(composed, filename);
}
