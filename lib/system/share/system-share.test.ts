import { describe, it, expect } from "vitest";
import {
  encodeSystemShare,
  decodeSystemShare,
  diffShareableSettings,
  clampStartTime,
  type SystemShare,
  type ShareableDefaults,
} from "@/lib/system/share/system-share";

const DEFAULTS: ShareableDefaults = {
  defaultColor: "#88ccff",
  killOpacity: 0.4,
  clusterColor: "#88ccff",
  clusterOpacity: 0.4,
};

function roundtrip(share: SystemShare): SystemShare {
  return decodeSystemShare(new URLSearchParams(encodeSystemShare(share)));
}

describe("encodeSystemShare / decodeSystemShare", () => {
  it("round-trips settings, camera, and playback (integers)", () => {
    const share: SystemShare = {
      settings: {
        defaultColor: "#ff0000",
        killOpacity: 0.7,
        deselectedTypeIds: [1, 2, 3],
      },
      camera: { position: [120000, -4000, 88000], target: [0, 0, 0] },
      playback: {
        startTime: 1719849600,
        window: 86400,
        speed: 3600,
        fade: "always",
        range: [1719000000, 1719849600],
      },
    };
    expect(roundtrip(share)).toEqual(share);
  });

  it("round-trips settings only", () => {
    const share: SystemShare = {
      settings: { clusterColor: "#00ff00", rangeSelected: 40009087 },
    };
    expect(roundtrip(share)).toEqual(share);
  });

  it("round-trips camera only", () => {
    const share: SystemShare = {
      camera: { position: [1, 2, 3], target: [4, 5, 6] },
    };
    expect(roundtrip(share)).toEqual(share);
  });

  it("encodes nothing for an empty share", () => {
    expect(encodeSystemShare({})).toBe("");
    expect(decodeSystemShare(new URLSearchParams(""))).toEqual({});
  });

  it("ignores a malformed token", () => {
    expect(decodeSystemShare(new URLSearchParams("s=not-base64!!"))).toEqual(
      {},
    );
  });

  it("ignores an unknown token version", () => {
    const token = btoa(
      JSON.stringify({ v: 999, settings: { killOpacity: 0.1 } }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeSystemShare(new URLSearchParams(`s=${token}`))).toEqual({});
  });

  it("ignores a non-numeric camera param", () => {
    expect(
      decodeSystemShare(new URLSearchParams("cam=a,b,c&tgt=0,0,0")),
    ).toEqual({});
  });

  it("drops playback if the start time has no accompanying config token", () => {
    expect(decodeSystemShare(new URLSearchParams("t=1719849600"))).toEqual({});
  });

  it("rejects a well-formed token whose settings/pb fields are wrong-typed", () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        settings: { killOpacity: 5, deselectedTypeIds: "not-an-array" },
        pb: { window: 100, speed: 1, fade: "not-a-fade-mode", range: [1, 2] },
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeSystemShare(
      new URLSearchParams(`s=${token}&t=1719849600`),
    );
    expect(result.settings).toBeUndefined();
    expect(result.playback).toBeUndefined();
  });

  it("rejects the whole token (settings included) when only pb is invalid", () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        settings: { killOpacity: 0.5 },
        pb: { window: 100, speed: 1, fade: "not-a-fade-mode", range: [1, 2] },
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeSystemShare(
      new URLSearchParams(`s=${token}&t=1719849600`),
    );
    expect(result.settings).toBeUndefined();
    expect(result.playback).toBeUndefined();
  });

  it("rejects a token whose settings color is not a hex string", () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        settings: { defaultColor: "red", clusterColor: "#xyz" },
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeSystemShare(new URLSearchParams(`s=${token}`));
    expect(result.settings).toBeUndefined();
  });

  it("rejects a token whose pb.range is a malformed tuple", () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        pb: { window: 100, speed: 1, fade: "always", range: ["a", "b"] },
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeSystemShare(
      new URLSearchParams(`s=${token}&t=1719849600`),
    );
    expect(result.playback).toBeUndefined();
  });

  it("rejects a token whose pb.range has the wrong length", () => {
    const token = btoa(
      JSON.stringify({
        v: 1,
        pb: { window: 100, speed: 1, fade: "always", range: [1] },
      }),
    )
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const result = decodeSystemShare(
      new URLSearchParams(`s=${token}&t=1719849600`),
    );
    expect(result.playback).toBeUndefined();
  });
});

describe("diffShareableSettings", () => {
  it("returns an empty object when everything is default", () => {
    expect(
      diffShareableSettings(
        {
          defaultColor: "#88ccff",
          killOpacity: 0.4,
          clusterColor: "#88ccff",
          clusterOpacity: 0.4,
          persistedTimeRange: null,
          deselectedTypeIds: [],
          showExcludedTypeIds: [],
          rangeSelected: null,
          range: null,
        },
        DEFAULTS,
      ),
    ).toEqual({});
  });
  it("includes only the changed fields", () => {
    expect(
      diffShareableSettings(
        {
          defaultColor: "#ff0000",
          killOpacity: 0.4,
          clusterColor: "#88ccff",
          clusterOpacity: 0.9,
          persistedTimeRange: { start: 100, end: "latest" },
          deselectedTypeIds: [5],
          showExcludedTypeIds: [],
          rangeSelected: null,
          range: 3,
        },
        DEFAULTS,
      ),
    ).toEqual({
      defaultColor: "#ff0000",
      clusterOpacity: 0.9,
      persistedTimeRange: { start: 100, end: "latest" },
      deselectedTypeIds: [5],
      range: 3,
    });
  });
});

describe("clampStartTime", () => {
  it("clamps below the EVE epoch floor", () => {
    expect(clampStartTime(0, 2_000_000_000)).toBe(1446508800);
  });
  it("clamps above now", () => {
    expect(clampStartTime(9_000_000_000, 2_000_000_000)).toBe(2_000_000_000);
  });
  it("passes through an in-range value", () => {
    expect(clampStartTime(1_700_000_000, 2_000_000_000)).toBe(1_700_000_000);
  });
});
