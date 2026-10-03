import { create } from "zustand";
import type { Command, CommandGroup } from "@/lib/commands/types";

export const GROUP_ORDER: CommandGroup[] = [
  "navigation",
  "map",
  "system",
  "panels",
  "help",
];

export function flattenCommands(
  providers: ReadonlyMap<string, Command[]>,
): Command[] {
  const rank = new Map(GROUP_ORDER.map((g, i) => [g, i] as const));
  const all: { cmd: Command; index: number }[] = [];
  let index = 0;
  for (const cmds of providers.values())
    for (const cmd of cmds) all.push({ cmd, index: index++ });
  all.sort(
    (a, b) =>
      (rank.get(a.cmd.group) ?? 99) - (rank.get(b.cmd.group) ?? 99) ||
      a.index - b.index,
  );
  return all.map((x) => x.cmd);
}

interface CommandStoreState {
  providers: Map<string, Command[]>;
  version: number;
  register: (providerId: string, commands: Command[]) => void;
  unregister: (providerId: string) => void;
}

export const useCommandStore = create<CommandStoreState>((set) => ({
  providers: new Map(),
  version: 0,
  register: (providerId, commands) =>
    set((s) => {
      const providers = new Map(s.providers);
      providers.set(providerId, commands);
      return { providers, version: s.version + 1 };
    }),
  unregister: (providerId) =>
    set((s) => {
      if (!s.providers.has(providerId)) return s;
      const providers = new Map(s.providers);
      providers.delete(providerId);
      return { providers, version: s.version + 1 };
    }),
}));
