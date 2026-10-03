import { describe, it, expect } from "vitest";
import {
  stampFor,
  mapPngFilename,
  systemPngFilename,
  killCsvFilename,
} from "./export-filename";

const MS = Date.UTC(2026, 8, 27, 14, 5, 42);

describe("export filenames", () => {
  it("stamps UTC to the minute with filesystem-safe separators", () => {
    expect(stampFor(MS)).toBe("2026-09-27T14-05Z");
  });
  it("names map, system, and csv exports", () => {
    expect(mapPngFilename("new-eden", MS)).toBe(
      "new-eden-map-2026-09-27T14-05Z.png",
    );
    expect(systemPngFilename("jita", MS)).toBe("jita-2026-09-27T14-05Z.png");
    expect(killCsvFilename("jita", MS)).toBe("jita-kills-2026-09-27.csv");
  });
});
