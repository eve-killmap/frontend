import { ElementType, ReactNode } from "react";
import { cn } from "@/lib/ui/cn";

type EyebrowSize = "sm" | "md" | "lg";

const SIZE: Record<EyebrowSize, string> = {
  sm: "text-3xs",
  md: "text-xs",
  lg: "text-base",
};

interface EyebrowProps {
  as?: ElementType<{ className?: string; children?: ReactNode }>;
  size?: EyebrowSize;
  className?: string;
  children: ReactNode;
}

export function Eyebrow({
  as: Tag = "span",
  size = "sm",
  className,
  children,
}: EyebrowProps) {
  return (
    <Tag
      className={cn(
        "uppercase tracking-widest font-semibold text-fg-subtle",
        SIZE[size],
        className,
      )}
    >
      {children}
    </Tag>
  );
}
