import { describe, it, expect } from "vitest";
import { createJSONStorage } from "zustand/middleware";
import { createPerSystemStore } from "@/stores/create-per-system-store";

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (name: string) => map.get(name) ?? null,
    setItem: (name: string, value: string) => {
      map.set(name, value);
    },
    removeItem: (name: string) => {
      map.delete(name);
    },
  };
}

interface Foo {
  a: number;
  b: string;
}
const DEFAULT: Foo = { a: 0, b: "" };

function makePer() {
  return createPerSystemStore<Foo>({
    name: "test-per-system",
    defaultValue: DEFAULT,
    persistOptions: { storage: createJSONStorage(memoryStorage) },
  });
}

describe("createPerSystemStore", () => {
  it("getCurrent is undefined before any write", () => {
    const per = makePer();
    per.setCurrentSlug("alpha");
    expect(per.getCurrent()).toBeUndefined();
  });

  it("setCurrent then getCurrent round-trips for the current slug", () => {
    const per = makePer();
    per.setCurrentSlug("alpha");
    per.setCurrent({ a: 1, b: "x" });
    expect(per.getCurrent()).toEqual({ a: 1, b: "x" });
  });

  it("isolates entries across slugs", () => {
    const per = makePer();
    per.setCurrentSlug("alpha");
    per.setCurrent({ a: 1, b: "x" });
    per.setCurrentSlug("beta");
    expect(per.getCurrent()).toBeUndefined();
    per.setCurrent({ a: 2, b: "y" });
    per.setCurrentSlug("alpha");
    expect(per.getCurrent()).toEqual({ a: 1, b: "x" });
  });

  it("ensureCurrent seeds defaultValue on first access", () => {
    const per = makePer();
    per.setCurrentSlug("gamma");
    expect(per.ensureCurrent()).toEqual(DEFAULT);
    expect(per.getCurrent()).toEqual(DEFAULT);
  });

  it("updateCurrent merges a partial", () => {
    const per = makePer();
    per.setCurrentSlug("alpha");
    per.setCurrent({ a: 1, b: "x" });
    per.updateCurrent((cur) => ({ a: cur.a + 10 }));
    expect(per.getCurrent()).toEqual({ a: 11, b: "x" });
  });

  it("clearCurrent removes only the current slug", () => {
    const per = makePer();
    per.setCurrentSlug("alpha");
    per.setCurrent({ a: 1, b: "x" });
    per.setCurrentSlug("beta");
    per.setCurrent({ a: 2, b: "y" });
    per.clearCurrent();
    expect(per.getCurrent()).toBeUndefined();
    per.setCurrentSlug("alpha");
    expect(per.getCurrent()).toEqual({ a: 1, b: "x" });
  });

  it("ensureCurrent preserves a stored falsy value (does not re-seed)", () => {
    const per = createPerSystemStore<number>({
      name: "test-falsy",
      defaultValue: 5,
      persistOptions: { storage: createJSONStorage(memoryStorage) },
    });
    per.setCurrentSlug("z");
    per.setCurrent(0);
    expect(per.ensureCurrent()).toBe(0);
    expect(per.getCurrent()).toBe(0);
  });
});

function makeCapped(maxSystems: number) {
  return createPerSystemStore<Foo>({
    name: "test-capped",
    defaultValue: DEFAULT,
    maxSystems,
    persistOptions: { storage: createJSONStorage(memoryStorage) },
  });
}

describe("createPerSystemStore LRU cap", () => {
  it("evicts the least-recently-written slug beyond maxSystems", () => {
    const per = makeCapped(3);
    for (const s of ["a", "b", "c", "d"]) {
      per.setCurrentSlug(s);
      per.setCurrent({ a: 1, b: s });
    }
    per.setCurrentSlug("a");
    expect(per.getCurrent()).toBeUndefined();
    for (const s of ["b", "c", "d"]) {
      per.setCurrentSlug(s);
      expect(per.getCurrent()).toEqual({ a: 1, b: s });
    }
  });

  it("re-writing a slug refreshes its recency so it is not evicted next", () => {
    const per = makeCapped(3);
    for (const s of ["a", "b", "c"]) {
      per.setCurrentSlug(s);
      per.setCurrent({ a: 1, b: s });
    }
    per.setCurrentSlug("a");
    per.setCurrent({ a: 9, b: "a" });
    per.setCurrentSlug("d");
    per.setCurrent({ a: 1, b: "d" });
    per.setCurrentSlug("a");
    expect(per.getCurrent()).toEqual({ a: 9, b: "a" });
    per.setCurrentSlug("b");
    expect(per.getCurrent()).toBeUndefined();
  });
});

describe("createPerSystemStore null-slug guard", () => {
  it("no-ops on a null slug and writes no bogus key", () => {
    const per = makePer();
    per.setCurrentSlug(null);
    expect(per.getCurrent()).toBeUndefined();
    per.setCurrent({ a: 1, b: "x" });
    expect(per.getCurrentSlug()).toBeNull();
    expect(Object.keys(per.store.getState().systems)).toHaveLength(0);
  });
});
