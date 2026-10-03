import React from "react";
import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import { ColumnLabel } from "./text";
import { formatIsk } from "@/lib/formatting/format-isk";
import { cn } from "@/lib/ui/cn";
import { ExternalLink } from "@/components/common/external-link";

export interface KillInfoProps {
  label: string;
  destroyedValue?: number | null;
  droppedValue?: number | null;
  totalValue?: number | null;
  zKillUrl: string;
  className?: string;
}

export const KillInfo = React.memo(function KillInfo({
  label,
  destroyedValue,
  droppedValue,
  totalValue,
  zKillUrl,
  className,
}: KillInfoProps) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <ColumnLabel>{label}</ColumnLabel>
      <div className="min-w-0 flex-1 flex flex-col">
        {destroyedValue != null ? (
          <p
            className="text-3xs text-red-400 leading-3 truncate pb-1"
            title="Destroyed Value"
          >
            {`${formatIsk(destroyedValue)} ISK`}
          </p>
        ) : null}
        {droppedValue != null ? (
          <p
            className="text-3xs text-green-400 leading-3 truncate pb-1"
            title="Dropped Value"
          >
            {`${formatIsk(droppedValue)} ISK`}
          </p>
        ) : null}
        {totalValue != null ? (
          <p
            className="text-3xs text-fg-strong leading-3 truncate pb-1 pt-1 border-t border-border/40"
            title="Total Value"
          >
            {`${formatIsk(totalValue)} ISK`}
          </p>
        ) : null}
        <ExternalLink
          href={zKillUrl}
          className="mt-auto pb-1 inline-flex items-center gap-0.5 text-2xs text-fg-faint hover:text-fg-secondary cursor-pointer leading-3"
        >
          zKill
          <ExternalLinkIcon size={11} />
        </ExternalLink>
      </div>
    </div>
  );
});
