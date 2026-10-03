import { describe, it, expect, beforeEach } from "vitest";
import {
  setOriginatingMap,
  originatingMapPath,
} from "@/lib/map/originating-map";

describe("originating-map", () => {
  beforeEach(() => {
    setOriginatingMap("new-eden");
  });

  it("maps each known map type to its route", () => {
    setOriginatingMap("new-eden");
    expect(originatingMapPath()).toBe("/");
    setOriginatingMap("anoikis");
    expect(originatingMapPath()).toBe("/anoikis");
    setOriginatingMap("abyssal-deadspace");
    expect(originatingMapPath()).toBe("/abyssal-deadspace");
    setOriginatingMap("tutorials");
    expect(originatingMapPath()).toBe("/tutorials");
  });

  it("falls back to '/' for an unknown map type", () => {
    setOriginatingMap("mystery-map");
    expect(originatingMapPath()).toBe("/");
  });

  it("returns the most recently recorded map (last write wins)", () => {
    setOriginatingMap("anoikis");
    setOriginatingMap("new-eden");
    expect(originatingMapPath()).toBe("/");
  });
});
