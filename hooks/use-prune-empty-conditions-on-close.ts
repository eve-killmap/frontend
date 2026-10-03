import { useEffect, useRef } from "react";
import { useFilterStore } from "@/stores/filter-store";

export function usePruneEmptyConditionsOnClose(open: boolean): void {
  const prune = useFilterStore((s) => s.pruneEmptyConditions);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) prune();
    wasOpen.current = open;
  }, [open, prune]);
}
