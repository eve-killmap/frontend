import { describe, it, expect } from "vitest";
import {
  characterZkillUrl,
  corporationZkillUrl,
  allianceZkillUrl,
  killmailZkillUrl,
  locationZkillUrl,
  characterPortraitUrl,
  corporationLogoUrl,
  allianceLogoUrl,
  shipIconUrl,
  shipRenderUrl,
  getEntityInfo,
} from "./eve-images";

describe("eve-images URL builders", () => {
  it("builds zkill URLs (no trailing slash)", () => {
    expect(characterZkillUrl(123)).toBe("https://zkillboard.com/character/123");
    expect(corporationZkillUrl(123)).toBe(
      "https://zkillboard.com/corporation/123",
    );
    expect(allianceZkillUrl(123)).toBe("https://zkillboard.com/alliance/123");
    expect(killmailZkillUrl(123)).toBe("https://zkillboard.com/kill/123");
  });

  it("builds evetech image URLs (?size=64)", () => {
    expect(characterPortraitUrl(123)).toBe(
      "https://images.evetech.net/characters/123/portrait?size=64",
    );
    expect(corporationLogoUrl(123)).toBe(
      "https://images.evetech.net/corporations/123/logo?size=64",
    );
    expect(allianceLogoUrl(123)).toBe(
      "https://images.evetech.net/alliances/123/logo?size=64",
    );
  });

  it("honors an explicit portrait and logo size", () => {
    expect(characterPortraitUrl(123, 128)).toBe(
      "https://images.evetech.net/characters/123/portrait?size=128",
    );
    expect(corporationLogoUrl(123, 128)).toBe(
      "https://images.evetech.net/corporations/123/logo?size=128",
    );
    expect(allianceLogoUrl(123, 128)).toBe(
      "https://images.evetech.net/alliances/123/logo?size=128",
    );
  });

  it("threads the size through getEntityInfo for every entity kind", () => {
    expect(getEntityInfo({ characterId: 1 }, 128).portraitUrl).toBe(
      "https://images.evetech.net/characters/1/portrait?size=128",
    );
    expect(getEntityInfo({ corporationId: 2 }, 128).portraitUrl).toBe(
      "https://images.evetech.net/corporations/2/logo?size=128",
    );
    expect(getEntityInfo({ allianceId: 3 }, 128).portraitUrl).toBe(
      "https://images.evetech.net/alliances/3/logo?size=128",
    );
    expect(getEntityInfo({ factionId: 500001 }, 128).portraitUrl).toBe(
      "https://images.evetech.net/corporations/500001/logo?size=128",
    );
    expect(getEntityInfo({ characterId: 1 }).portraitUrl).toBe(
      "https://images.evetech.net/characters/1/portrait?size=64",
    );
  });

  it("builds the location zkill URL (with trailing slash)", () => {
    expect(locationZkillUrl(123)).toBe("https://zkillboard.com/location/123/");
  });

  it("builds ship type URLs, defaulting to 64px", () => {
    expect(shipIconUrl(670)).toBe(
      "https://images.evetech.net/types/670/icon?size=64",
    );
    expect(shipRenderUrl(670)).toBe(
      "https://images.evetech.net/types/670/render?size=64",
    );
  });

  it("honors an explicit ship type image size", () => {
    expect(shipIconUrl(670, 32)).toBe(
      "https://images.evetech.net/types/670/icon?size=32",
    );
    expect(shipRenderUrl(670, 128)).toBe(
      "https://images.evetech.net/types/670/render?size=128",
    );
  });
});
