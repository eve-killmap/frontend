export type ExportFn = () => Promise<void>;

export let exportMapPngFn: ExportFn | null = null;
export function setExportMapPngFn(fn: ExportFn | null): void {
  exportMapPngFn = fn;
}

export let exportSystemPngFn: ExportFn | null = null;
export function setExportSystemPngFn(fn: ExportFn | null): void {
  exportSystemPngFn = fn;
}

export let exportSystemCsvFn: ExportFn | null = null;
export function setExportSystemCsvFn(fn: ExportFn | null): void {
  exportSystemCsvFn = fn;
}
