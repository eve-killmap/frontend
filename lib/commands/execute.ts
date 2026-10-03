import type { Command } from "./types";

export function executeCommand(cmd: Command, close: () => void): boolean {
  if (cmd.disabled?.()) return false;
  close();
  cmd.run();
  return true;
}
