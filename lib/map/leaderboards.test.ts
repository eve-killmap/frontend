import { describe, it, expect } from "vitest";
import {
  LEADERBOARD_KINDS,
  LEADERBOARD_SCOPES,
  LEADERBOARD_WINDOWS,
  leaderboardEntryLabel,
  leaderboardFilterCondition,
  leaderboardImageUrl,
  leaderboardsPath,
} from "./leaderboards";

describe("leaderboardsPath", () => {
  it("builds the all-time attacker path at the fixed limit", () => {
    expect(leaderboardsPath("all", "attacker", "all")).toBe(
      "/stats/leaderboards?window=all&role=attacker&scope=all&limit=10",
    );
  });
  it("builds a short-window victim path", () => {
    expect(leaderboardsPath("7d", "victim", "all")).toBe(
      "/stats/leaderboards?window=7d&role=victim&scope=all&limit=10",
    );
  });
  it("carries the player-only scope the backend spells in the plural", () => {
    expect(leaderboardsPath("1d", "attacker", "players")).toBe(
      "/stats/leaderboards?window=1d&role=attacker&scope=players&limit=10",
    );
  });
  it("always sends a scope, which the endpoint requires", () => {
    for (const scope of LEADERBOARD_SCOPES)
      expect(leaderboardsPath("all", "attacker", scope.key)).toContain(
        `scope=${scope.key}`,
      );
  });
});

describe("leaderboardImageUrl", () => {
  it("maps each kind to its evetech image path", () => {
    expect(leaderboardImageUrl("character", 1)).toBe(
      "https://images.evetech.net/characters/1/portrait?size=64",
    );
    expect(leaderboardImageUrl("corporation", 2)).toBe(
      "https://images.evetech.net/corporations/2/logo?size=64",
    );
    expect(leaderboardImageUrl("alliance", 3)).toBe(
      "https://images.evetech.net/alliances/3/logo?size=64",
    );
    expect(leaderboardImageUrl("faction", 500001)).toBe(
      "https://images.evetech.net/corporations/500001/logo?size=64",
    );
    expect(leaderboardImageUrl("ship", 587)).toBe(
      "https://images.evetech.net/types/587/icon?size=64",
    );
    expect(leaderboardImageUrl("weapon", 2456)).toBe(
      "https://images.evetech.net/types/2456/icon?size=64",
    );
  });
});

describe("leaderboardEntryLabel", () => {
  it("uses the name when present", () => {
    expect(leaderboardEntryLabel({ id: 1, name: "Pilot", kills: 1 })).toBe(
      "Pilot",
    );
  });
  it("falls back to the id", () => {
    expect(leaderboardEntryLabel({ id: 91000001, kills: 1 })).toBe("#91000001");
  });
});

describe("leaderboardFilterCondition", () => {
  it("builds a sided condition for a corporation with its ticker", () => {
    const c = leaderboardFilterCondition("corporation", "attacker", {
      id: 98000001,
      name: "Corp",
      ticker: "TCK",
      kills: 40,
    });
    expect(c.uid).toMatch(/^fc\d+$/);
    expect(c.attribute).toBe("corporation");
    expect(c.side).toBe("attacker");
    expect(c.values).toEqual([
      {
        id: 98000001,
        name: "Corp",
        image_url:
          "https://images.evetech.net/corporations/98000001/logo?size=64",
        ticker: "TCK",
      },
    ]);
  });
  it("leaves side undefined for weapons", () => {
    const c = leaderboardFilterCondition("weapon", "victim", {
      id: 2456,
      name: "Light Missile",
      kills: 3,
    });
    expect(c.attribute).toBe("weapon");
    expect(c.side).toBeUndefined();
  });
  it("carries a null ticker and the id label when name and ticker are absent", () => {
    const c = leaderboardFilterCondition("character", "victim", {
      id: 91000001,
      kills: 2,
    });
    expect(c.side).toBe("victim");
    expect(c.values[0]).toEqual({
      id: 91000001,
      name: "#91000001",
      image_url:
        "https://images.evetech.net/characters/91000001/portrait?size=64",
      ticker: null,
    });
  });
  it("issues a fresh uid per call", () => {
    const e = { id: 1, kills: 1 };
    expect(leaderboardFilterCondition("ship", "attacker", e).uid).not.toBe(
      leaderboardFilterCondition("ship", "attacker", e).uid,
    );
  });
});

describe("constants", () => {
  it("lists the six API windows in display order", () => {
    expect(LEADERBOARD_WINDOWS.map((w) => w.key)).toEqual([
      "all",
      "1d",
      "7d",
      "30d",
      "6m",
      "1y",
    ]);
  });
  it("lists the six board kinds in display order", () => {
    expect(LEADERBOARD_KINDS.map((k) => k.key)).toEqual([
      "character",
      "corporation",
      "alliance",
      "faction",
      "ship",
      "weapon",
    ]);
  });
  it("lists both API scopes, broadest first, with their labels", () => {
    expect(LEADERBOARD_SCOPES).toEqual([
      { key: "all", label: "NPCs & Players" },
      { key: "players", label: "Players Only" },
    ]);
  });
});
