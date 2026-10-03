import { RawKillsResponse } from "../schema/system-schema";

export function decodeKillsBinary(buffer: ArrayBuffer): RawKillsResponse {
  if (buffer.byteLength < 4)
    throw new Error("Malformed kills payload: too short");

  const bytes = new Uint8Array(buffer);
  let pos = 0;

  function readVarint(): number {
    let low = 0;
    let high = 0;
    let shift = 0;
    for (;;) {
      if (pos >= bytes.length)
        throw new Error("Malformed kills payload: truncated varint");
      const byte = bytes[pos++];
      const bits = byte & 0x7f;
      if (shift < 28) low |= bits << shift;
      else high += bits * 2 ** (shift - 28);
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }
    return (low >>> 0) + high * 0x10000000;
  }

  function zigzagDecode(n: number): number {
    return (n & 1) === 0 ? n / 2 : -(n + 1) / 2;
  }

  function readDeltaColumn(count: number): number[] {
    const out = new Array<number>(count);
    let prev = 0;
    for (let i = 0; i < count; i++) {
      prev += zigzagDecode(readVarint());
      out[i] = prev;
    }
    return out;
  }

  function readPlainZigzagColumn(count: number): number[] {
    const out = new Array<number>(count);
    for (let i = 0; i < count; i++) out[i] = zigzagDecode(readVarint());
    return out;
  }

  const count = new DataView(buffer).getUint32(0, false);
  if (count > buffer.byteLength - 4)
    throw new Error("Malformed kills payload: count exceeds buffer");
  pos = 4;

  const killmail_ids = readDeltaColumn(count);
  const killmail_times = readDeltaColumn(count);
  const x = readDeltaColumn(count);
  const y = readDeltaColumn(count);
  const z = readDeltaColumn(count);
  const ship_types = readPlainZigzagColumn(count);

  return { count, killmail_ids, killmail_times, x, y, z, ship_types };
}
