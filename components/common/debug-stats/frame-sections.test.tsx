import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { FrameSection, MemorySection, RendererSection } from "./frame-sections";
import { fmtMb, fmtMs } from "./format";

const frame = {
  fps1s: 60,
  fps30s: 58,
  fps1m: 57,
  frameMsLast: 16.7,
  frameMsMax1s: 33.2,
  drawCalls: 12,
  triangles: 3400,
  points: 50000,
  lines: 12000,
  geometries: 7,
  textures: 3,
  programs: 2,
  heapUsedMb: 123.456,
  heapTotalMb: 512,
};

describe("frame sections", () => {
  it("renders the fps averages and frame time", () => {
    const html = renderToStaticMarkup(<FrameSection frame={frame} />);
    expect(html).toContain("60 / 58 (30s) / 57 (1m)");
    expect(html).toContain("16.7 ms (max 33.2 ms)");
  });
  it("renders every renderer counter with locale grouping", () => {
    const html = renderToStaticMarkup(<RendererSection frame={frame} />);
    expect(html).toContain((50000).toLocaleString());
    expect(html).toContain((12000).toLocaleString());
    expect(html).toContain((3400).toLocaleString());
    expect(html).toContain("Programs");
  });
  it("renders heap usage, or a dash when unavailable", () => {
    expect(renderToStaticMarkup(<MemorySection frame={frame} />)).toContain(
      "123.5 MB / 512.0 MB",
    );
    expect(
      renderToStaticMarkup(
        <MemorySection
          frame={{ ...frame, heapUsedMb: null, heapTotalMb: null }}
        />,
      ),
    ).toContain("–");
  });
});

describe("format helpers", () => {
  it("formats megabytes and milliseconds", () => {
    expect(fmtMb(123.456)).toBe("123.5 MB");
    expect(fmtMb(null)).toBe("–");
    expect(fmtMs(16.666)).toBe("16.7 ms");
  });
});
