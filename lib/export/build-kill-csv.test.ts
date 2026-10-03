import { describe, it, expect } from "vitest";
import { buildKillCsv, csvField, KILL_CSV_HEADER } from "./build-kill-csv";
import type { FilteredKills } from "@/lib/kill/kill-filter";

const BOM = "﻿";
const HEADER = KILL_CSV_HEADER.join(",");

function rows(partial: Partial<FilteredKills>): FilteredKills {
  return {
    x: [],
    y: [],
    z: [],
    killmailIds: [],
    shipTypes: [],
    killmailTimes: [],
    count: 0,
    earliestTime: null,
    latestTime: null,
    ...partial,
  };
}

const names = new Map([
  [587, "Rifter"],
  [11993, 'Cruiser, "Special"'],
]);
const nearest = (pos: [number, number, number]) =>
  pos[0] > 0 ? { name: "Jita IV - Moon 4", distance: 1234.6 } : null;

describe("csvField", () => {
  it("quotes only when needed and doubles inner quotes", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField(42)).toBe("42");
    expect(csvField("a,b")).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("line\nbreak")).toBe('"line\nbreak"');
  });
});

describe("buildKillCsv", () => {
  it("emits BOM, header, CRLF rows in input order with resolved names and nearest object", () => {
    const csv = buildKillCsv(
      rows({
        count: 2,
        killmailIds: [2, 1],
        killmailTimes: [1_790_000_000, 1_700_000_000],
        shipTypes: [11993, 587],
        x: [10, 5],
        y: [0, 0],
        z: [1, 2],
      }),
      { shipNames: names, nearest },
    );
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(BOM + HEADER);
    expect(lines[1]).toBe(
      '2,2026-09-21T14:13:20Z,11993,"Cruiser, ""Special""",10,0,1,Jita IV - Moon 4,1235',
    );
    expect(lines[2]).toBe(
      "1,2023-11-14T22:13:20Z,587,Rifter,5,0,2,Jita IV - Moon 4,1235",
    );
    expect(lines[3]).toBe("");
    expect(csv.endsWith("\r\n")).toBe(true);
  });

  it("leaves nearest and distance empty for a kill with no position, and name empty when unknown", () => {
    const csv = buildKillCsv(
      rows({
        count: 1,
        killmailIds: [9],
        killmailTimes: [1_700_000_000],
        shipTypes: [1],
        x: [0],
        y: [0],
        z: [0],
      }),
      { shipNames: names, nearest },
    );
    expect(csv.split("\r\n")[1]).toBe("9,2023-11-14T22:13:20Z,1,,0,0,0,,");
  });

  it("produces a header-only file for zero rows", () => {
    expect(buildKillCsv(rows({}), { shipNames: names, nearest })).toBe(
      `${BOM}${HEADER}\r\n`,
    );
  });
});
