import { ReactNode } from "react";

export function DebugOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-auto select-none w-72 max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden whitespace-normal wrap-break-word text-2xs font-mono text-fg-secondary [text-shadow:0_1px_2px_rgb(0_0_0/0.9)]">
      {children}
    </div>
  );
}
