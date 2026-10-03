import { ReactNode } from "react";
import { Eyebrow } from "@/components/common/eyebrow";

interface ColumnLabelProps {
  children: ReactNode;
}

export function ColumnLabel({ children }: ColumnLabelProps) {
  return <Eyebrow size="sm">{children}</Eyebrow>;
}
