import { describe, it, expect, vi } from "vitest";
import { downloadBlob, type DownloadEnv } from "./download";

function fakeEnv() {
  const anchor = { href: "", download: "", click: vi.fn() };
  const scheduled: (() => void)[] = [];
  const env: DownloadEnv = {
    createObjectURL: vi.fn(() => "blob:fake"),
    revokeObjectURL: vi.fn(),
    createAnchor: () => anchor,
    schedule: (fn) => scheduled.push(fn),
  };
  return { env, anchor, scheduled };
}

describe("downloadBlob", () => {
  it("clicks an anchor pointing at the object URL, then revokes it later", () => {
    const { env, anchor, scheduled } = fakeEnv();
    const blob = new Blob(["x"], { type: "text/plain" });
    downloadBlob(blob, "file.txt", env);
    expect(env.createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchor.href).toBe("blob:fake");
    expect(anchor.download).toBe("file.txt");
    expect(anchor.click).toHaveBeenCalledTimes(1);
    expect(env.revokeObjectURL).not.toHaveBeenCalled();
    scheduled.forEach((fn) => fn());
    expect(env.revokeObjectURL).toHaveBeenCalledWith("blob:fake");
  });
});
