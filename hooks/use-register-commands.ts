import { useEffect } from "react";
import type { Command } from "@/lib/commands/types";
import { useCommandStore } from "@/stores/command-store";

export function useRegisterCommands(
  providerId: string,
  commands: Command[],
): void {
  const register = useCommandStore((s) => s.register);
  const unregister = useCommandStore((s) => s.unregister);
  useEffect(() => {
    register(providerId, commands);
    return () => unregister(providerId);
  }, [providerId, commands, register, unregister]);
}
