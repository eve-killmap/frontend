import { ReactNode } from "react";
import { Eyebrow } from "@/components/common/eyebrow";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <div
      className={`bg-panel overflow-hidden flex flex-col border border-border ${className}`}
    >
      {children}
    </div>
  );
}

interface PanelHeaderProps {
  children: ReactNode;
}

export function PanelHeader({ children }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
      {children}
    </div>
  );
}

interface PanelTitleProps {
  children: ReactNode;
}

export function PanelTitle({ children }: PanelTitleProps) {
  return (
    <Eyebrow size="md" className="text-fg-secondary">
      {children}
    </Eyebrow>
  );
}
