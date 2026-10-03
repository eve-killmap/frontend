import { describe, it, expect } from "vitest";
import { decodeKillsBinary } from "@/lib/kill/kill-binary-decoder";

function zigzagEncode(v: number): number {
  return v >= 0 ? v * 2 : -v * 2 - 1;
}
function writeVarint(out: number[], value: number) {
  while (value >= 0x80) {
    out.push((value % 128) | 0x80);
    value = Math.floor(value / 128);
  }
  out.push(value);
}
function writeDeltaColumn(out: number[], values: number[]) {
  let prev = 0;
  for (const v of values) {
    writeVarint(out, zigzagEncode(v - prev));
    prev = v;
  }
}
function writePlainZigzagColumn(out: number[], values: number[]) {
  for (const v of values) writeVarint(out, zigzagEncode(v));
}
function encodeKills(cols: {
  count: number;
  killmail_ids: number[];
  killmail_times: number[];
  x: number[];
  y: number[];
  z: number[];
  ship_types: number[];
}): ArrayBuffer {
  const body: number[] = [];
  writeDeltaColumn(body, cols.killmail_ids);
  writeDeltaColumn(body, cols.killmail_times);
  writeDeltaColumn(body, cols.x);
  writeDeltaColumn(body, cols.y);
  writeDeltaColumn(body, cols.z);
  writePlainZigzagColumn(body, cols.ship_types);
  const buf = new ArrayBuffer(4 + body.length);
  new DataView(buf).setUint32(0, cols.count, false);
  new Uint8Array(buf).set(body, 4);
  return buf;
}

describe("decodeKillsBinary", () => {
  it("round-trips a dataset with negative deltas and large values", () => {
    const cols = {
      count: 3,
      killmail_ids: [1000, 1005, 1002],
      killmail_times: [1_700_000_000, 1_700_000_050, 1_699_999_990],
      x: [0, 5_000_000_000, -3],
      y: [10, 20, 30],
      z: [0, 0, 0],
      ship_types: [587, 588, 589],
    };
    const decoded = decodeKillsBinary(encodeKills(cols));
    expect(decoded.count).toBe(3);
    expect(decoded.killmail_ids).toEqual(cols.killmail_ids);
    expect(decoded.killmail_times).toEqual(cols.killmail_times);
    expect(decoded.x).toEqual(cols.x);
    expect(decoded.y).toEqual(cols.y);
    expect(decoded.z).toEqual(cols.z);
    expect(decoded.ship_types).toEqual(cols.ship_types);
  });

  it("decodes an empty payload", () => {
    const decoded = decodeKillsBinary(
      encodeKills({
        count: 0,
        killmail_ids: [],
        killmail_times: [],
        x: [],
        y: [],
        z: [],
        ship_types: [],
      }),
    );
    expect(decoded.count).toBe(0);
    expect(decoded.killmail_ids).toEqual([]);
  });

  it("throws on a buffer smaller than the 4-byte header", () => {
    expect(() => decodeKillsBinary(new Uint8Array([0, 0]).buffer)).toThrow(
      /too short/,
    );
  });
  it("throws on a truncated varint instead of decoding garbage", () => {
    expect(() =>
      decodeKillsBinary(new Uint8Array([0, 0, 0, 1, 0x80]).buffer),
    ).toThrow(/truncated varint/);
  });
  it("rejects an implausibly large count without a huge allocation", () => {
    expect(() =>
      decodeKillsBinary(new Uint8Array([0xff, 0xff, 0xff, 0xff]).buffer),
    ).toThrow(/count exceeds/);
  });
});
