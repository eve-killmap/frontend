import { describe, it, expect } from "vitest";
import { systemHeaderSpec, connectionsLabel } from "./system-header";
import {
  SECURITY_HEX,
  WORMHOLE_CLASS_HEX,
  wormholeEffectHex,
  securityIndex,
} from "@/lib/map/system-colors";

const jita = {
  name: "Jita",
  securityStatus: 0.945,
  constellationName: "Kimotoro",
  regionName: "The Forge",
};

describe("connectionsLabel", () => {
  it("mirrors the neighbour map wording", () => {
    expect(connectionsLabel(0)).toBe("0 Connections");
    expect(connectionsLabel(1)).toBe("1 connection");
    expect(connectionsLabel(4)).toBe("4 connections");
  });
});

describe("systemHeaderSpec", () => {
  it("builds a known-space header with a coloured security value and no class", () => {
    const spec = systemHeaderSpec(jita, 4);
    expect(spec.name).toBe("Jita");
    expect(spec.classLabel).toBeNull();
    expect(spec.securityLabel).toBe("0.9");
    expect(spec.securityHex).toBe(SECURITY_HEX[securityIndex(0.945)]);
    expect(spec.constellation).toBe("Kimotoro");
    expect(spec.region).toBe("The Forge");
    expect(spec.effectLabel).toBeNull();
    expect(spec.connections).toBe("4 connections");
  });

  it("builds a wormhole header with coloured class and effect", () => {
    const spec = systemHeaderSpec(
      {
        name: "J123456",
        securityStatus: -1,
        constellationName: "C-C00001",
        regionName: "C-R00001",
        wormholeClassID: 5,
        wormholeEffect: 5,
      },
      0,
    );
    expect(spec.classLabel).toBe("C5");
    expect(spec.classHex).toBe(WORMHOLE_CLASS_HEX[5]);
    expect(spec.securityLabel).toBe("-1.0");
    expect(spec.securityHex).toBe(SECURITY_HEX[0]);
    expect(spec.effectLabel).toBe("Wolf-Rayet");
    expect(spec.effectHex).toBe(wormholeEffectHex(5));
    expect(spec.connections).toBe("0 Connections");
  });

  it("omits the class label when it equals the system name, as the screen does", () => {
    const spec = systemHeaderSpec(
      {
        name: "Thera",
        securityStatus: -0.99,
        constellationName: "Thera",
        regionName: "Thera",
        wormholeClassID: 12,
      },
      3,
    );
    expect(spec.classLabel).toBeNull();
    expect(spec.effectLabel).toBeNull();
  });
});
