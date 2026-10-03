import { frameStats } from "@/lib/frame-stats";
import { Row } from "./debug-row";
import { fmtMb, fmtMs } from "./format";

export type FrameSnapshot = typeof frameStats;

export function FrameSection({ frame }: { frame: FrameSnapshot }) {
  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="FPS"
        value={`${frame.fps1s} / ${frame.fps30s} (30s) / ${frame.fps1m} (1m)`}
      />
      <Row
        label="Frame Time"
        value={`${fmtMs(frame.frameMsLast)} (max ${fmtMs(frame.frameMsMax1s)})`}
      />
    </div>
  );
}

export function RendererSection({ frame }: { frame: FrameSnapshot }) {
  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row label="Draw Calls" value={frame.drawCalls.toLocaleString()} />
      <Row label="Triangles" value={frame.triangles.toLocaleString()} />
      <Row label="Points" value={frame.points.toLocaleString()} />
      <Row label="Lines" value={frame.lines.toLocaleString()} />
      <Row label="Geometries" value={frame.geometries.toLocaleString()} />
      <Row label="Textures" value={frame.textures.toLocaleString()} />
      <Row label="Programs" value={frame.programs.toLocaleString()} />
    </div>
  );
}

export function MemorySection({ frame }: { frame: FrameSnapshot }) {
  return (
    <div className="space-y-0.5 mt-0.5 ml-2">
      <Row
        label="JS Heap"
        value={
          frame.heapUsedMb == null
            ? "–"
            : `${fmtMb(frame.heapUsedMb)} / ${fmtMb(frame.heapTotalMb)}`
        }
      />
    </div>
  );
}
