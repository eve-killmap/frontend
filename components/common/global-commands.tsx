import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { buildGlobalCommands } from "@/lib/commands/build-global-commands";
import { currentShortcutLabel } from "@/lib/commands/platform";
import { openInfoFn } from "@/lib/info-functions";
import { navigateTo } from "@/lib/navigation-functions";
import { useRegisterCommands } from "@/hooks/use-register-commands";

export function GlobalCommands() {
  const { pathname } = useLocation();
  const commands = useMemo(
    () =>
      buildGlobalCommands({
        currentPath: pathname,
        navigate: (path) => navigateTo?.(path),
        openInfo: () => {
          if (!openInfoFn) return false;
          openInfoFn();
          return true;
        },
        shortcutLabel: currentShortcutLabel(),
      }),
    [pathname],
  );
  useRegisterCommands("global", commands);
  return null;
}
