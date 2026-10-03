import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useCommandState } from "cmdk";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type {
  Command as CommandSpec,
  CommandGroup as Group,
} from "@/lib/commands/types";
import { executeCommand } from "@/lib/commands/execute";
import { isPaletteHotkey } from "@/lib/commands/hotkey";
import { matchSystems } from "@/lib/commands/match-systems";
import { commandMatches } from "@/lib/commands/command-matches";
import { fetchSystemsCached, peekSystems } from "@/lib/api/systems";
import { SystemsData } from "@/lib/schema/map-schema";
import { slugify } from "@/lib/formatting/slugify";
import { navigateTo } from "@/lib/navigation-functions";
import { isTriglavianSystem } from "@/lib/map/triglavian";
import { useCommandStore, flattenCommands } from "@/stores/command-store";
import { useCommandPaletteStore } from "@/stores/command-palette-store";
import { useSystemHistoryStore } from "@/stores/system/system-history-store";
import { useHighlightedSystemStore } from "@/stores/map/highlighted-system-store";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { SystemRow } from "./system-row";
import { AppLink } from "./app-link";

const GROUP_HEADINGS: Record<Group, string> = {
  navigation: "Navigation",
  map: "Map",
  system: "System",
  panels: "Panels",
  help: "Help",
};

function safeSlug(name: string): string | null {
  try {
    return slugify(name);
  } catch {
    return null;
  }
}

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const setOpen = useCommandPaletteStore((s) => s.setOpen);
  const toggle = useCommandPaletteStore((s) => s.toggle);
  const [query, setQuery] = useState("");
  const [systems, setSystems] = useState<SystemsData | null>(peekSystems);
  const [systemsFailed, setSystemsFailed] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!isPaletteHotkey(e)) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    if (systems) return;
    setSystemsFailed(false);
    let alive = true;
    fetchSystemsCached()
      .then((d) => alive && setSystems(d))
      .catch(() => alive && setSystemsFailed(true));
    return () => {
      alive = false;
    };
  }, [open, systems]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="rounded-none p-0 gap-0 sm:max-w-xl top-[15vh] translate-y-0 bg-panel overflow-hidden"
      >
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <DialogDescription className="sr-only">
          Search solar systems and run commands. Use the arrow keys to move,
          Enter to run, and Escape to close.
        </DialogDescription>
        <PaletteBody
          query={query}
          onQueryChange={setQuery}
          systems={systems}
          systemsFailed={systemsFailed}
          close={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function PaletteBody({
  query,
  onQueryChange,
  systems,
  systemsFailed,
  close,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  systems: SystemsData | null;
  systemsFailed: boolean;
  close: () => void;
}) {
  const providers = useCommandStore((s) => s.providers);
  const commands = useMemo(() => flattenCommands(providers), [providers]);

  const recents = useSystemHistoryStore((s) => s.recents);
  const pinned = useSystemHistoryStore((s) => s.pinned);
  const togglePin = useSystemHistoryStore((s) => s.togglePin);
  const triglavianFont = useGlobalSettingsStore((s) => s.triglavianFont);

  const names = systems?.systems ?? null;
  const nameBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const n of names ?? []) {
      const slug = safeSlug(n);
      if (slug) m.set(slug, n);
    }
    return m;
  }, [names]);
  const nameToId = useMemo(() => {
    const m = new Map<string, number>();
    if (systems)
      systems.systems.forEach((n, i) =>
        m.set(n.toLowerCase(), systems.systemIDs[i]),
      );
    return m;
  }, [systems]);
  const isTrig = (name: string) =>
    triglavianFont && isTriglavianSystem(nameToId.get(name.toLowerCase()) ?? 0);

  const trimmed = query.trim();
  const matches = useMemo(
    () => (names ? matchSystems(trimmed, names) : []),
    [trimmed, names],
  );
  const recentSlugs = useMemo(
    () => recents.filter((s) => !pinned.includes(s)),
    [recents, pinned],
  );

  const goTo = (slug: string) => {
    close();
    navigateTo?.(`/${slug}`);
  };

  const groups = useMemo(() => {
    const out = new Map<Group, CommandSpec[]>();
    for (const c of commands) {
      const list = out.get(c.group) ?? [];
      list.push(c);
      out.set(c.group, list);
    }
    return out;
  }, [commands]);

  const systemRow = (name: string, pinnedRow: boolean) => {
    const slug = safeSlug(name);
    if (!slug) return null;
    return (
      <SystemRow
        key={`sys:${slug}`}
        name={name}
        slug={slug}
        triglavian={isTrig(name)}
        pinned={pinnedRow}
        onSelect={() => goTo(slug)}
        onTogglePin={togglePin}
      />
    );
  };

  return (
    <Command
      shouldFilter={false}
      className="bg-panel **:data-[slot=command-input-wrapper]:h-11"
    >
      <CommandInput
        placeholder="Search systems or type a command…"
        value={query}
        onValueChange={onQueryChange}
        autoFocus
      />
      <ActiveSystemHighlighter nameToId={nameToId} />
      <CommandList className="max-h-[50vh]">
        <CommandEmpty>Nothing matches.</CommandEmpty>

        {trimmed.length === 0 && pinned.length > 0 && (
          <CommandGroup heading="Pinned">
            {pinned.map((slug) =>
              systemRow(nameBySlug.get(slug) ?? slug, true),
            )}
          </CommandGroup>
        )}
        {trimmed.length === 0 && recentSlugs.length > 0 && (
          <CommandGroup heading="Recent">
            {recentSlugs.map((slug) =>
              systemRow(nameBySlug.get(slug) ?? slug, false),
            )}
          </CommandGroup>
        )}

        {trimmed.length >= 2 &&
          ((!names && !systemsFailed) ||
            systemsFailed ||
            matches.length > 0) && (
            <CommandGroup heading="Systems">
              {!names && !systemsFailed && (
                <CommandItem disabled value="__loading">
                  Loading systems…
                </CommandItem>
              )}
              {systemsFailed && (
                <CommandItem disabled value="__failed">
                  Systems unavailable
                </CommandItem>
              )}
              {matches.map((name) =>
                systemRow(name, pinned.includes(safeSlug(name) ?? "")),
              )}
            </CommandGroup>
          )}

        {[...groups.entries()].map(([group, cmds]) => {
          const visible = cmds.filter((c) => commandMatches(c, trimmed));
          if (visible.length === 0) return null;
          return (
            <CommandGroup key={group} heading={GROUP_HEADINGS[group]}>
              {visible.map((cmd) => (
                <CommandRow
                  key={cmd.id}
                  cmd={cmd}
                  onRun={() => executeCommand(cmd, close)}
                />
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
      <div className="flex items-center gap-3 border-t border-border px-3 py-1.5 text-2xs text-fg-subtle select-none">
        <span>↑↓ navigate</span>
        <span>↵ run</span>
        <span>esc close</span>
      </div>
    </Command>
  );
}

function CommandRow({ cmd, onRun }: { cmd: CommandSpec; onRun: () => void }) {
  const state = cmd.state?.();
  const disabled = cmd.disabled?.() ?? false;
  const inner = (
    <>
      <span className="flex-1 truncate">{cmd.label}</span>
      {state === "active" && (
        <Check
          className="size-3.5 text-capsuleer"
          role="img"
          aria-label="active"
        />
      )}
      {(state === "on" || state === "off") && (
        <span
          className={`text-2xs font-mono ${state === "on" ? "text-capsuleer" : "text-fg-subtle"}`}
        >
          {state}
        </span>
      )}
      {cmd.shortcut && <CommandShortcut>{cmd.shortcut}</CommandShortcut>}
    </>
  );
  return (
    <CommandItem
      value={cmd.id}
      disabled={disabled}
      onSelect={onRun}
      className="cursor-pointer"
    >
      {cmd.href ? (
        <AppLink
          to={cmd.href}
          navigate={false}
          tabIndex={-1}
          className="flex flex-1 items-center gap-2 min-w-0"
        >
          {inner}
        </AppLink>
      ) : (
        inner
      )}
    </CommandItem>
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
    return () => setHighlight(null);
  }, [activeValue, nameToId, setHighlight]);
  return null;
}
