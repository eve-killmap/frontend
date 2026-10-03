export interface DownloadAnchor {
  href: string;
  download: string;
  click(): void;
}

export interface DownloadEnv {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  createAnchor(): DownloadAnchor;
  schedule(fn: () => void): void;
}

function browserDownloadEnv(): DownloadEnv {
  return {
    createObjectURL: (b) => URL.createObjectURL(b),
    revokeObjectURL: (u) => URL.revokeObjectURL(u),
    createAnchor: () => document.createElement("a"),
    schedule: (fn) => setTimeout(fn, 0),
  };
}

export function downloadBlob(
  blob: Blob,
  filename: string,
  env: DownloadEnv = browserDownloadEnv(),
): void {
  const url = env.createObjectURL(blob);
  const a = env.createAnchor();
  a.href = url;
  a.download = filename;
  a.click();
  env.schedule(() => env.revokeObjectURL(url));
}
