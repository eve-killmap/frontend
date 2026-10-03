import { useState, useCallback, useEffect, useMemo } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
} from "@/components/ui/command";
import { useCommandState } from "cmdk";
import { slugify } from "@/lib/formatting/slugify";
import { navigateTo } from "@/lib/navigation-functions";
import { useSystemHistoryStore } from "@/stores/system/system-history-store";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { isTriglavianSystem } from "@/lib/map/triglavian";
import { useHighlightedSystemStore } from "@/stores/map/highlighted-system-store";
import { SystemRow } from "@/components/common/system-row";
import { useCommandPaletteStore } from "@/stores/command-palette-store";
import { currentShortcutLabel } from "@/lib/commands/platform";

interface SystemSearchProps {
  systems: string[];
  systemIDs: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SystemSearch({
  systems,
  systemIDs,
  open,
  onOpenChange,
}: SystemSearchProps) {
  const [inputValue, setInputValue] = useState("");

  const togglePalette = useCommandPaletteStore((s) => s.toggle);

  const recents = useSystemHistoryStore((s) => s.recents);
  const pinned = useSystemHistoryStore((s) => s.pinned);
  const togglePin = useSystemHistoryStore((s) => s.togglePin);

  const triglavianFont = useGlobalSettingsStore((s) => s.triglavianFont);
  const triglavianNames = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < systems.length; i++) {
      if (isTriglavianSystem(systemIDs[i] ?? 0)) set.add(systems[i]);
    }
    return set;
  }, [systems, systemIDs]);
  const isTrig = (name: string) => triglavianFont && triglavianNames.has(name);

  const nameBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const name of systems) {
      try {
        m.set(slugify(name), name);
      } catch {
        /* ignore */
      }
    }
    return m;
  }, [systems]);

  const filteredSystems = useMemo(() => {
    if (!inputValue.trim()) return [];
    const search = inputValue.toLowerCase();
    return systems
      .filter((name) => name.toLowerCase().includes(search))
      .slice(0, 10);
  }, [inputValue, systems]);

  const goToSlug = useCallback((slug: string) => {
    navigateTo?.(`/${slug}`);
  }, []);

  const searching = open && inputValue.trim().length > 0;
  const showEmptyState = open && inputValue.trim().length === 0;
  const recentSlugs = useMemo(
    () => recents.filter((s) => !pinned.includes(s)),
    [recents, pinned],
  );

  const setHighlight = useHighlightedSystemStore((s) => s.setHighlightedSystem);
  const nameToId = useMemo(() => {
    const m = new Map<string, number>();
    for (let i = 0; i < systems.length; i++) {
      const id = systemIDs[i];
      if (id != null) m.set(systems[i].toLowerCase(), id);
    }
    return m;
  }, [systems, systemIDs]);
  useEffect(() => {
    if (!open) setHighlight(null);
  }, [open, setHighlight]);
  useEffect(() => () => setHighlight(null), [setHighlight]);

  return (
    <Command
      shouldFilter={false}
      className="relative border bg-panel shadow-md w-70 **:data-[slot=command-input-wrapper]:h-9.5"
    >
      <CommandInput
        placeholder="Search solar systems..."
        value={inputValue}
        onValueChange={setInputValue}
        onFocus={() => onOpenChange(true)}
        onBlur={() => setTimeout(() => onOpenChange(false), 200)}
        className="pr-14"
      />
      <button
        type="button"
        aria-label={`Open command palette (${currentShortcutLabel()})`}
        title={currentShortcutLabel()}
        onMouseDown={(e) => e.preventDefault()}
        onClick={togglePalette}
        onKeyDown={(e) => e.stopPropagation()}
        className="absolute right-2 top-2.5 border border-border px-1 text-2xs font-mono leading-4 text-fg-subtle hover:text-capsuleer hover:border-capsuleer/60 cursor-pointer select-none"
      >
        {currentShortcutLabel()}
      </button>

      <ActiveSystemHighlighter nameToId={nameToId} />

      {searching && filteredSystems.length > 0 && (
        <CommandList>
          <CommandGroup>
            {filteredSystems.map((name) => {
              const slug = slugify(name);
              return (
                <SystemRow
                  key={slug}
                  name={name}
                  slug={slug}
                  triglavian={isTrig(name)}
                  pinned={pinned.includes(slug)}
                  onSelect={() => goToSlug(slug)}
                  onTogglePin={togglePin}
                />
              );
            })}
          </CommandGroup>
        </CommandList>
      )}

      {searching && filteredSystems.length === 0 && (
        <CommandList>
          <CommandEmpty>No systems found.</CommandEmpty>
        </CommandList>
      )}

      {showEmptyState && (pinned.length > 0 || recentSlugs.length > 0) && (
        <CommandList>
          {pinned.length > 0 && (
            <CommandGroup heading="Pinned">
              {pinned.map((slug) => {
                const name = nameBySlug.get(slug) ?? slug;
                return (
                  <SystemRow
                    key={slug}
                    name={name}
                    slug={slug}
                    triglavian={isTrig(name)}
                    pinned
                    onSelect={() => goToSlug(slug)}
                    onTogglePin={togglePin}
                  />
                );
              })}
            </CommandGroup>
          )}
          {recentSlugs.length > 0 && (
            <CommandGroup heading="Recent">
              {recentSlugs.map((slug) => {
                const name = nameBySlug.get(slug) ?? slug;
                return (
                  <SystemRow
                    key={slug}
                    name={name}
                    slug={slug}
                    triglavian={isTrig(name)}
                    pinned={false}
                    onSelect={() => goToSlug(slug)}
                    onTogglePin={togglePin}
                  />
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      )}
    </Command>
  );
}

function ActiveSystemHighlighter({
  nameToId,
}: {
  nameToId: Map<string, number>;
}) {
  const activeValue = useCommandState((state) => state.value);
  const setHighlight = useHighlightedSystemStore((s) => s.setHighlightedSystem);
  useEffect(() => {
    setHighlight(
      activeValue ? (nameToId.get(activeValue.toLowerCase()) ?? null) : null,
    );
  }, [activeValue, nameToId, setHighlight]);
  return null;
}
