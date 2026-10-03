import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  decideCollapse,
  INITIAL_COLLAPSE,
  type CollapseState,
} from "@/lib/ui/collapse-labels";

const SLACK_PX = 32;

export function useCollapseLabels<T extends HTMLElement>(): {
  ref: RefObject<T | null>;
  collapsed: boolean;
} {
  const ref = useRef<T>(null);
  const stateRef = useRef<CollapseState>(INITIAL_COLLAPSE);
  const [collapsed, setCollapsed] = useState(false);

  useLayoutEffect(() => {
    const row = ref.current;
    if (!row || typeof ResizeObserver === "undefined") return;

    const measure = () => {
      let measured = SLACK_PX;
      for (const el of row.querySelectorAll<HTMLElement>("[data-measure]"))
        measured += el.getBoundingClientRect().width;
      const next = decideCollapse(stateRef.current, row.clientWidth, measured);
      stateRef.current = next;
      setCollapsed(next.collapsed);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    for (const el of row.querySelectorAll<HTMLElement>("[data-measure]"))
      observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, collapsed };
}
