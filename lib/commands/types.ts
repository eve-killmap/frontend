export type CommandGroup = "navigation" | "map" | "system" | "panels" | "help";
export type CommandState = "on" | "off" | "active";

export interface Command {
  id: string;
  label: string;
  group: CommandGroup;
  keywords?: string[];
  href?: string;
  shortcut?: string;
  state?: () => CommandState | undefined;
  disabled?: () => boolean;
  run: () => void;
}
