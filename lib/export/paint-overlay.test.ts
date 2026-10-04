import { describe, it, expect, vi } from "vitest";
import {
  paintOverlay,
  LEGEND_WIDTH,
  MARGIN,
  WATERMARK,
  type PaintCtx,
} from "./paint-overlay";
import { ACTIVITY_HEX } from "@/lib/map/system-colors";

function fakeCtx() {
  const calls: {
    op: string;
    args: unknown[];
    font?: string;
    baseline?: string;
  }[] = [];
  const gradient = { addColorStop: vi.fn() };
  const raw = {
    font: "",
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    textAlign: "left",
    textBaseline: "alphabetic",
    globalAlpha: 1,
    fillRect: (...args: unknown[]) => calls.push({ op: "fillRect", args }),
    strokeRect: (...args: unknown[]) => calls.push({ op: "strokeRect", args }),
    fillText: (...args: unknown[]) =>
      calls.push({
        op: "fillText",
        args,
        font: raw.font,
        baseline: raw.textBaseline,
      }),
    drawImage: (...args: unknown[]) => calls.push({ op: "drawImage", args }),
    measureText: (t: string) => ({ width: t.length * 6 }),
    createLinearGradient: () => gradient,
  };
  const ctx = raw as unknown as PaintCtx;
  return { ctx, calls, gradient };
}

const SIZE = { width: 1000, height: 600 };
const MAP = {
  kind: "map" as const,
  title: "New Eden",
  subtitle: null,
  timeLabel: "Screenshot taken 2026-09-27 14:05 UTC",
};
const CAPTION_RESERVE = 11 + 8;

describe("paintOverlay", () => {
  it("draws the map title top-centre, the time bottom-left and the watermark when the legend is empty", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, { ...MAP, legend: [], scale: 2 });
    const texts = calls.filter((c) => c.op === "fillText");
    expect(texts.map((t) => t.args[0])).toEqual([
      "New Eden",
      MAP.timeLabel,
      WATERMARK,
    ]);
    const [title, time, mark] = texts;
    expect(title.font).toContain("bold 48px");
    expect(title.font).toContain('"Barlow"');
    expect(title.baseline).toBe("alphabetic");
    expect(title.args[1]).toBe(500 - ("New Eden".length * 6) / 2);
    expect((title.args[2] as number) < 100).toBe(true);
    expect(time.font).toContain('"Space Mono"');
    expect(time.args.slice(1)).toEqual([MARGIN * 2, 600 - MARGIN * 2]);
    expect(mark.args.slice(1)).toEqual([1000 - MARGIN * 2, 600 - MARGIN * 2]);
    expect(calls.some((c) => c.op === "fillRect")).toBe(false);
    expect(calls.some((c) => c.op === "strokeRect")).toBe(false);
  });

  it("paints the colour mode and overlay as an upper-case second line", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      ...MAP,
      subtitle: "Kill Activity · Hot Areas",
      legend: [],
      scale: 1,
    });
    const texts = calls.filter((c) => c.op === "fillText");
    expect(texts.map((t) => t.args[0])).toEqual([
      "New Eden",
      "KILL ACTIVITY · HOT AREAS",
      MAP.timeLabel,
      WATERMARK,
    ]);
    const [title, sub] = texts;
    expect(sub.font).toContain("12px");
    expect(sub.args[1]).toBe(
      500 - ("KILL ACTIVITY · HOT AREAS".length * 6) / 2,
    );
    expect((sub.args[2] as number) > (title.args[2] as number)).toBe(true);
  });

  it("draws a scaled legend panel at bottom-left, above the time caption, with the gradient stops", () => {
    const { ctx, calls, gradient } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      ...MAP,
      scale: 2,
      legend: [
        {
          type: "gradient",
          title: "Kills (all-time)",
          stops: ACTIVITY_HEX,
          min: "0",
          max: "99",
        },
      ],
    });
    const panel = calls.find(
      (c) => c.op === "fillRect" && c.args[2] === LEGEND_WIDTH * 2,
    )!;
    expect(panel.args[0]).toBe(MARGIN * 2);
    const [, y, , h] = panel.args as number[];
    expect(y + h).toBe(600 - MARGIN * 2 - CAPTION_RESERVE * 2);
    expect(calls.some((c) => c.op === "strokeRect")).toBe(true);
    expect(gradient.addColorStop).toHaveBeenCalledTimes(ACTIVITY_HEX.length);
    const labels = calls
      .filter((c) => c.op === "fillText")
      .map((c) => c.args[0]);
    expect(labels).toEqual(
      expect.arrayContaining([
        "New Eden",
        "Kills (all-time)",
        "0",
        "99",
        MAP.timeLabel,
        WATERMARK,
      ]),
    );
    const time = calls.find(
      (c) => c.op === "fillText" && c.args[0] === MAP.timeLabel,
    )!;
    expect(time.args[2]).toBe(600 - MARGIN * 2);
  });

  it("draws swatches once per entry", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      ...MAP,
      scale: 1,
      legend: [
        {
          type: "swatches",
          title: "Wormhole class",
          columns: 2,
          entries: [
            { label: "C1", hex: "#5252ff" },
            { label: "C2", hex: "#00a8a8" },
          ],
        },
      ],
    });
    const rects = calls.filter((c) => c.op === "fillRect");
    expect(rects).toHaveLength(1 + 2);
  });

  it("lays out a single-column swatch block in one growing column", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      ...MAP,
      scale: 1,
      legend: [
        {
          type: "swatches",
          title: "Wormhole effect",
          columns: 1,
          entries: [
            { label: "Pulsar", hex: "#5252ff" },
            { label: "Black Hole", hex: "#00a8a8" },
            { label: "Cataclysmic", hex: "#a83232" },
          ],
        },
      ],
    });
    const swatchRects = calls
      .filter((c) => c.op === "fillRect")
      .slice(1)
      .map((c) => c.args as number[]);
    expect(swatchRects).toHaveLength(3);
    const [x0] = swatchRects[0];
    expect(swatchRects.every(([x]) => x === x0)).toBe(true);
    expect(swatchRects[0][1]).toBeLessThan(swatchRects[1][1]);
    expect(swatchRects[1][1]).toBeLessThan(swatchRects[2][1]);
  });

  it("wraps a long swatch label onto further lines and grows the row", () => {
    const short = fakeCtx();
    paintOverlay(short.ctx, SIZE, {
      ...MAP,
      scale: 1,
      legend: [
        {
          type: "swatches",
          title: "Kill colors",
          columns: 1,
          entries: [{ label: "Rifter", hex: "#ff0000" }],
        },
      ],
    });
    const shortPanel = short.calls.find(
      (c) => c.op === "fillRect" && c.args[2] === LEGEND_WIDTH,
    )!.args as number[];

    const { ctx, calls } = fakeCtx();
    const long = "Combat Battlecruiser, Ferox, Rifter, Punisher, Merlin";
    paintOverlay(ctx, SIZE, {
      ...MAP,
      scale: 1,
      legend: [
        {
          type: "swatches",
          title: "Kill colors",
          columns: 1,
          entries: [
            { label: long, hex: "#ff0000" },
            { label: "All others", hex: "#88ccff" },
          ],
        },
      ],
    });
    const panel = calls.find(
      (c) => c.op === "fillRect" && c.args[2] === LEGEND_WIDTH,
    )!.args as number[];
    const texts = calls.filter((c) => c.op === "fillText");
    const lines = texts
      .map((t) => t.args as [string, number, number])
      .filter(([text]) => long.includes(text) && text !== long);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.map(([text]) => text).join(" ")).toBe(long);
    expect(new Set(lines.map(([, x]) => x)).size).toBe(1);
    expect(lines[1][2] - lines[0][2]).toBe(14);
    const others = texts.find((t) => t.args[0] === "All others")!;
    expect(others.args[2]).toBe(lines[lines.length - 1][2] + 14);
    expect(panel[3] - shortPanel[3]).toBe(lines.length * 14);
  });

  it("wraps a long title into multiple lines", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      ...MAP,
      scale: 1,
      legend: [
        {
          type: "gradient",
          title: "Kills matching filter (2026-09-01 to 2026-09-27)",
          stops: ACTIVITY_HEX,
          min: "0",
          max: "99",
        },
      ],
    });
    const titleTexts = calls
      .filter((c) => c.op === "fillText")
      .map((c) => c.args[0] as string)
      .filter(
        (t) =>
          t !== "0" &&
          t !== "99" &&
          t !== WATERMARK &&
          t !== MAP.title &&
          t !== MAP.timeLabel,
      );
    expect(titleTexts).toEqual([
      "Kills matching filter",
      "(2026-09-01 to 2026-09-27)",
    ]);
  });

  it("draws a text block's note as its own fillText line", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      ...MAP,
      scale: 1,
      legend: [
        {
          type: "text",
          title: "Sovereignty overlay",
          note: "ADM data unavailable, so territory sizes reflect system count only.",
        },
      ],
    });
    const texts = calls
      .filter((c) => c.op === "fillText")
      .map((c) => c.args[0] as string);
    expect(texts).toContain("Sovereignty overlay");
    expect(texts.some((t) => t.startsWith("ADM data unavailable"))).toBe(true);
    expect(texts.indexOf("Sovereignty overlay")).not.toBe(
      texts.findIndex((t) => t.startsWith("ADM data unavailable")),
    );
  });

  it("draws the known-space header segments centred at the top with no backdrop, the time bottom-left, and the watermark", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      kind: "system",
      scale: 1,
      header: {
        name: "Jita",
        classLabel: null,
        securityLabel: "0.9",
        securityHex: "#2c75e1",
        constellation: "Kimotoro",
        region: "The Forge",
        effectLabel: null,
        connections: "4 connections",
      },
      timeLabel: "Screenshot taken 2026-09-27 14:05 UTC",
    });
    const texts = calls.filter((c) => c.op === "fillText");
    expect(texts.map((t) => t.args[0])).toEqual([
      "Jita",
      "0.9",
      "KIMOTORO · THE FORGE",
      "4 CONNECTIONS",
      "Screenshot taken 2026-09-27 14:05 UTC",
      WATERMARK,
    ]);
    const [name, sec] = texts;
    expect((name.args[1] as number) < (sec.args[1] as number)).toBe(true);
    expect(name.args[2]).toBe(sec.args[2]);
    expect(name.baseline).toBe("alphabetic");
    expect(sec.baseline).toBe("alphabetic");
    expect(name.font).toContain('"Barlow"');
    expect(name.font).toContain("bold 24px");
    expect(sec.font).toContain('"Space Mono"');
    expect(texts[2].font).toContain('"Barlow"');
    expect(texts[4].font).toContain('"Space Mono"');
    const nameW = 4 * 6;
    const secW = 3 * 6;
    const gap = 8;
    expect(name.args[1]).toBe(500 - (nameW + gap + secW) / 2);
    expect(texts[2].args[1]).toBe(
      500 - ("KIMOTORO · THE FORGE".length * 6) / 2,
    );
    expect(texts[3].args[1]).toBe(500 - ("4 CONNECTIONS".length * 6) / 2);
    expect(texts[4].args.slice(1)).toEqual([MARGIN, 600 - MARGIN]);
    expect(texts[5].args.slice(1)).toEqual([1000 - MARGIN, 600 - MARGIN]);
    expect(calls.some((c) => c.op === "fillRect")).toBe(false);
  });

  it("draws the wormhole header with class, security, and effect in their colours", () => {
    const { ctx, calls } = fakeCtx();
    const fills: string[] = [];
    const recordingCtx = new Proxy(ctx, {
      set(target, prop, value) {
        if (prop === "fillStyle") fills.push(String(value));
        return Reflect.set(target, prop, value);
      },
    });
    paintOverlay(recordingCtx, SIZE, {
      kind: "system",
      scale: 2,
      header: {
        name: "J123456",
        classLabel: "C5",
        classHex: "#a85400",
        securityLabel: "-1.0",
        securityHex: "#8d3163",
        constellation: "C-C00001",
        region: "C-R00001",
        effectLabel: "Wolf-Rayet",
        effectHex: "#abcdef",
        connections: "0 Connections",
      },
      timeLabel: "Screenshot taken 2026-09-27 14:05 UTC (playback)",
    });
    const texts = calls
      .filter((c) => c.op === "fillText")
      .map((c) => c.args[0] as string);
    expect(texts).toEqual([
      "J123456",
      "C5",
      "-1.0",
      "C-C00001 · C-R00001 · ",
      "WOLF-RAYET",
      "0 CONNECTIONS",
      "Screenshot taken 2026-09-27 14:05 UTC (playback)",
      WATERMARK,
    ]);
    expect(fills).toEqual(
      expect.arrayContaining(["#a85400", "#8d3163", "#abcdef"]),
    );
  });

  const jita = {
    name: "Jita",
    classLabel: null,
    securityLabel: "0.9",
    securityHex: "#2c75e1",
    constellation: "Kimotoro",
    region: "The Forge",
    effectLabel: null,
    connections: "4 connections",
  };

  it("paints a system legend above the time caption when one is given", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      kind: "system",
      scale: 1,
      header: jita,
      legend: [
        {
          type: "swatches",
          title: "Kill colors",
          columns: 1,
          entries: [
            { label: "Frigate", hex: "#0000ff" },
            { label: "All others", hex: "#88ccff" },
          ],
        },
      ],
      timeLabel: "t",
    });
    const panel = calls.find(
      (c) => c.op === "fillRect" && c.args[2] === LEGEND_WIDTH,
    )!;
    const [x, y, , h] = panel.args as number[];
    expect(x).toBe(MARGIN);
    expect(y + h).toBe(600 - MARGIN - CAPTION_RESERVE);
    const texts = calls
      .filter((c) => c.op === "fillText")
      .map((c) => c.args[0]);
    expect(texts).toEqual(
      expect.arrayContaining(["Kill colors", "Frigate", "All others", "t"]),
    );
    expect(calls.filter((c) => c.op === "fillRect")).toHaveLength(1 + 2);
  });

  it("paints a centered-object line with its icon under the connections", () => {
    const { ctx, calls } = fakeCtx();
    const icon = {} as CanvasImageSource;
    paintOverlay(ctx, SIZE, {
      kind: "system",
      scale: 1,
      header: {
        ...jita,
        focus: { kind: "centered", name: "Jita IV - Moon 4", icon },
      },
      timeLabel: "t",
    });
    const texts = calls.filter((c) => c.op === "fillText");
    expect(texts.map((t) => t.args[0])).toEqual([
      "Jita",
      "0.9",
      "KIMOTORO · THE FORGE",
      "4 CONNECTIONS",
      "CENTERED",
      "Jita IV - Moon 4",
      "t",
      WATERMARK,
    ]);
    const image = calls.find((c) => c.op === "drawImage")!;
    expect(image.args[0]).toBe(icon);
    expect(image.args[3]).toBe(16);
    expect(image.args[4]).toBe(16);
    const labelEnd = (texts[4].args[1] as number) + "CENTERED".length * 6;
    expect((image.args[1] as number) >= labelEnd).toBe(true);
    expect((image.args[1] as number) + 16 <= (texts[5].args[1] as number)).toBe(
      true,
    );
    expect(texts[4].args[2]).toBe(texts[5].args[2]);
    expect((texts[4].args[2] as number) > (texts[3].args[2] as number)).toBe(
      true,
    );
  });

  it("paints a nearest-object line with its distance and no icon when none is given", () => {
    const { ctx, calls } = fakeCtx();
    paintOverlay(ctx, SIZE, {
      kind: "system",
      scale: 2,
      header: {
        ...jita,
        focus: {
          kind: "nearest",
          name: "Jita IV - Moon 4 - Mining Beacon",
          distanceLabel: "1,234 km",
        },
      },
      timeLabel: "t",
    });
    const texts = calls
      .filter((c) => c.op === "fillText")
      .map((c) => c.args[0]);
    expect(texts).toContain("NEAREST");
    expect(texts).toContain("Jita IV - Moon 4 - Mining Beacon");
    expect(texts).toContain("· 1,234 km");
    expect(calls.some((c) => c.op === "drawImage")).toBe(false);
  });
});
