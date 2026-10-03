import React from "react";
import { ShipIcon } from "./ship-icon";
import { ColumnLabel } from "./text";
import { cn } from "@/lib/ui/cn";
import { ExternalLink } from "@/components/common/external-link";

export const FIGHTER_CARD_IMAGE_SIZE = 128;

function titleIfTruncated(text: string) {
  return {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      const el = e.currentTarget;
      el.title = el.scrollWidth > el.clientWidth ? text : "";
    },
  };
}

export interface FighterCardProps {
  label: string;
  portrait: string | null;
  shipTypeId?: number | null;
  shipName?: string | null;
  zKillUrl: string | null;
  name: string;
  corp?: string | null;
  alliance?: string | null;
  faction?: string | null;
  className?: string;
}

export const FighterCard = React.memo(function FighterCard({
  label,
  portrait,
  shipTypeId,
  shipName,
  zKillUrl,
  name,
  corp,
  alliance,
  faction,
  className,
}: FighterCardProps) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <ColumnLabel>{label}</ColumnLabel>
      <div className="min-w-0">
        <div className="flex gap-1 mb-1">
          {shipTypeId && (
            <ShipIcon
              typeId={shipTypeId}
              name={shipName}
              size={FIGHTER_CARD_IMAGE_SIZE}
            />
          )}
          {portrait && (
            <img
              src={portrait}
              alt=""
              className="w-12 h-12 rounded-sm bg-elevated-subtle shrink-0"
            />
          )}
        </div>
        {zKillUrl ? (
          <ExternalLink
            href={zKillUrl}
            className="block w-full text-2xs text-left font-semibold text-foreground hover:text-fg-strong leading-3.5 truncate cursor-pointer"
            {...titleIfTruncated(name)}
          >
            {name}
          </ExternalLink>
        ) : (
          <p
            className="text-2xs font-semibold text-foreground leading-3.5 truncate"
            {...titleIfTruncated(name)}
          >
            {name}
          </p>
        )}
        {corp && (
          <p
            className="text-3xs text-fg-faint leading-3 truncate"
            {...titleIfTruncated(corp)}
          >
            {corp}
          </p>
        )}
        {alliance && (
          <p
            className="text-3xs text-fg-faint leading-3 truncate"
            {...titleIfTruncated(alliance)}
          >
            {alliance}
          </p>
        )}
        {faction && (
          <p
            className="text-3xs text-fg-faint leading-3 truncate"
            {...titleIfTruncated(faction)}
          >
            {faction}
          </p>
        )}
      </div>
    </div>
  );
});
