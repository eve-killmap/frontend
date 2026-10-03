import { ReactNode } from "react";

export function Flag({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-xs bg-elevated px-1 py-px text-3xs uppercase tracking-wide leading-none text-fg-faint">
      {children}
    </span>
  );
}
