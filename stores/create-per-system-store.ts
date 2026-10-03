import { create, StoreApi, UseBoundStore } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

interface SystemsState<T> {
  systems: Record<string, T>;
}

export interface PerSystemStore<T> {
  store: UseBoundStore<StoreApi<SystemsState<T>>>;
  setCurrentSlug: (slug: string | null) => void;
  getCurrentSlug: () => string | null;
  getCurrent: () => T | undefined;
  ensureCurrent: () => T;
  setCurrent: (value: T) => void;
  updateCurrent: (updater: (cur: T) => Partial<T>) => void;
  clearCurrent: () => void;
}

function putLRU<T>(
  systems: Record<string, T>,
  slug: string,
  value: T,
  cap: number,
): Record<string, T> {
  const { [slug]: _drop, ...rest } = systems;
  const next: Record<string, T> = { ...rest, [slug]: value };
  const keys = Object.keys(next);
  const evict = keys.length - cap;
  for (let i = 0; i < evict; i++) delete next[keys[i]];
  return next;
}

export function createPerSystemStore<T>(opts: {
  name: string;
  defaultValue?: T;
  maxSystems?: number;
  persistOptions?: Partial<PersistOptions<SystemsState<T>, unknown>>;
}): PerSystemStore<T> {
  let currentSlug: string | null = null;
  const maxSystems = opts.maxSystems ?? Infinity;

  const store = create<SystemsState<T>>()(
    persist(() => ({ systems: {} }) as SystemsState<T>, {
      name: opts.name,
      ...opts.persistOptions,
    } as PersistOptions<SystemsState<T>, unknown>),
  );

  const getCurrent = (): T | undefined => {
    if (currentSlug === null) return undefined;
    return store.getState().systems[currentSlug];
  };

  const ensureCurrent = (): T => {
    const slug = currentSlug;
    if (slug === null) {
      if (opts.defaultValue === undefined)
        throw new Error(
          `createPerSystemStore(${opts.name}): ensureCurrent needs a defaultValue`,
        );
      return opts.defaultValue;
    }
    const existing = store.getState().systems[slug];
    if (existing !== undefined) return existing;
    if (opts.defaultValue === undefined)
      throw new Error(
        `createPerSystemStore(${opts.name}): ensureCurrent needs a defaultValue`,
      );
    const seeded = opts.defaultValue;
    store.setState((state) => ({
      systems: putLRU(state.systems, slug, seeded, maxSystems),
    }));
    return seeded;
  };

  const setCurrent = (value: T): void => {
    const slug = currentSlug;
    if (slug === null) return;
    store.setState((state) => ({
      systems: putLRU(state.systems, slug, value, maxSystems),
    }));
  };

  const updateCurrent = (updater: (cur: T) => Partial<T>): void => {
    const slug = currentSlug;
    if (slug === null) return;
    store.setState((state) => {
      const existing = state.systems[slug];
      if (existing === undefined && opts.defaultValue === undefined)
        throw new Error(
          `createPerSystemStore(${opts.name}): updateCurrent needs a seeded entry or a defaultValue`,
        );
      const cur = existing ?? (opts.defaultValue as T);
      return {
        systems: putLRU(
          state.systems,
          slug,
          { ...cur, ...updater(cur) },
          maxSystems,
        ),
      };
    });
  };

  const clearCurrent = (): void => {
    const slug = currentSlug;
    if (slug === null) return;
    store.setState((state) => {
      const { [slug]: _removed, ...rest } = state.systems;
      return { systems: rest };
    });
  };

  return {
    store,
    setCurrentSlug: (slug) => {
      currentSlug = slug;
    },
    getCurrentSlug: () => currentSlug,
    getCurrent,
    ensureCurrent,
    setCurrent,
    updateCurrent,
    clearCurrent,
  };
}
