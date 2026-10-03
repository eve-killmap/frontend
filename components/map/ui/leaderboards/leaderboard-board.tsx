import { Eyebrow } from "@/components/common/eyebrow";
import { ShipIcon } from "@/components/common/ship-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { LeaderboardEntry } from "@/lib/schema/map-schema";
import {
  LEADERBOARD_LIMIT,
  LeaderboardKind,
  leaderboardEntryLabel,
  leaderboardImageUrl,
} from "@/lib/map/leaderboards";

const SKELETON_WIDTHS = [78, 62, 85, 55, 70, 90, 60, 74, 52, 68];

export function LeaderboardBoardSkeleton({ label }: { label: string }) {
  return (
    <div>
      <Eyebrow as="h3" size="md" className="text-fg-secondary mb-1.5">
        {label}
      </Eyebrow>
      <ol>
        {Array.from({ length: LEADERBOARD_LIMIT }).map((_, i) => (
          <li key={i} className="flex items-center gap-2 px-1 py-0.5">
            <span className="text-xs text-fg-subtle w-4 shrink-0 text-right tabular-nums">
              {i + 1}
            </span>
            <Skeleton className="size-6 rounded-xs shrink-0 bg-panel-elevated" />
            <span className="flex-1 min-w-0">
              <Skeleton
                className="h-3 bg-panel-elevated"
                style={{
                  width: `${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}%`,
                }}
              />
            </span>
            <Skeleton className="h-3 w-8 shrink-0 bg-panel-elevated" />
          </li>
        ))}
      </ol>
    </div>
  );
}

export function LeaderboardBoard({
  kind,
  label,
  entries,
  onSelect,
}: {
  kind: LeaderboardKind;
  label: string;
  entries: LeaderboardEntry[];
  onSelect: (entry: LeaderboardEntry) => void;
}) {
  return (
    <div>
      <Eyebrow as="h3" size="md" className="text-fg-secondary mb-1.5">
        {label}
      </Eyebrow>
      {entries.length === 0 ? (
        <p className="text-2xs text-fg-subtle italic px-1 py-1">
          No data for this window.
        </p>
      ) : (
        <ol>
          {entries.map((entry, i) => {
            const name = leaderboardEntryLabel(entry);
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry)}
                  title={`Filter the map by ${name}`}
                  className="w-full flex items-center gap-2 px-1 py-0.5 hover:bg-panel-elevated text-left transition-colors group cursor-pointer"
                >
                  <span className="text-xs text-fg-subtle w-4 shrink-0 text-right tabular-nums">
                    {i + 1}
                  </span>
                  {kind === "ship" || kind === "weapon" ? (
                    <ShipIcon
                      typeId={entry.id}
                      className="w-6 h-6 rounded-xs"
                    />
                  ) : (
                    <img
                      src={leaderboardImageUrl(kind, entry.id)}
                      alt=""
                      width={24}
                      height={24}
                      loading="lazy"
                      decoding="async"
                      className="size-6 rounded-xs shrink-0 bg-elevated-subtle"
                    />
                  )}
                  <span className="text-xs text-fg-secondary group-hover:text-foreground flex-1 truncate transition-colors">
                    {name}
                    {entry.ticker ? (
                      <span className="text-fg-faint"> [{entry.ticker}]</span>
                    ) : null}
                  </span>
                  <span className="text-xs text-fg-faint shrink-0 tabular-nums">
                    {entry.kills.toLocaleString()}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
