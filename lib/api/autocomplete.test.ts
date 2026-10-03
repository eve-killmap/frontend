import { describe, it, expect } from "vitest";
import {
  entityAutocompleteUrl,
  autocompleteEntities,
  weaponAutocompleteUrl,
  autocompleteWeapons,
  shipAutocompleteUrl,
  autocompleteShips,
} from "./autocomplete";

describe("entityAutocompleteUrl", () => {
  it("builds the query with kind, q, limit", () => {
    expect(entityAutocompleteUrl("alliance", "goon")).toContain(
      "/autocomplete/entities?",
    );
    expect(entityAutocompleteUrl("alliance", "goon")).toContain(
      "kind=alliance",
    );
    expect(entityAutocompleteUrl("alliance", "goon")).toContain("q=goon");
    expect(entityAutocompleteUrl("alliance", "goon")).toContain("limit=30");
  });
});

describe("autocompleteEntities", () => {
  it("returns [] without a network call when q < 3 chars", async () => {
    expect(await autocompleteEntities("character", "ab")).toEqual([]);
  });
});

describe("weaponAutocompleteUrl", () => {
  it("builds the /autocomplete/weapons query with q + limit", () => {
    const url = weaponAutocompleteUrl("scourge");
    expect(url).toContain("/autocomplete/weapons?");
    expect(url).toContain("q=scourge");
    expect(url).toContain("limit=30");
  });
});

describe("autocompleteWeapons", () => {
  it("returns [] without a network call when q < 3 chars", async () => {
    expect(await autocompleteWeapons("ab")).toEqual([]);
  });
});

describe("shipAutocompleteUrl", () => {
  it("builds the /autocomplete/ships query with q + limit", () => {
    const url = shipAutocompleteUrl("rifter");
    expect(url).toContain("/autocomplete/ships?");
    expect(url).toContain("q=rifter");
    expect(url).toContain("limit=30");
  });
});

describe("autocompleteShips", () => {
  it("returns [] without a network call when q < 3 chars", async () => {
    expect(await autocompleteShips("ab")).toEqual([]);
  });
});
