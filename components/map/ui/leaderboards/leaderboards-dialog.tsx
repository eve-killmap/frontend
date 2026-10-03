import { Button } from "@/components/ui/button";
import { useLeaderboards } from "@/hooks/map/use-leaderboards";
import { useFilterStore } from "@/stores/filter-store";
import { formatAbsoluteUTC } from "@/lib/formatting/time";
import { LeaderboardEntry } from "@/lib/schema/map-schema";
import {
  LEADERBOARD_KINDS,
  LEADERBOARD_ROLES,
  LEADERBOARD_SCOPES,
  LEADERBOARD_WINDOWS,
  LeaderboardKind,
  LeaderboardRole,
  LeaderboardScope,
  LeaderboardWindow,
  leaderboardFilterCondition,
} from "@/lib/map/leaderboards";
import {
  LeaderboardBoard,
  LeaderboardBoardSkeleton,
} from "./leaderboard-board";

const SEGMENT_CLASS =
  "px-4 py-1 text-sm rounded-md border border-transparent transition-colors cursor-pointer";

function SegmentedGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { readonly key: T; readonly label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex bg-panel border border-border p-0.5 rounded-lg"
    >
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          aria-pressed={value === option.key}
          onClick={() => onChange(option.key)}
          className={`${SEGMENT_CLASS} ${
            value === option.key
              ? "bg-panel-elevated text-capsuleer"
              : "text-fg-muted hover:text-fg-secondary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function LeaderboardsDialogBody({
  timeWindow,
  role,
  scope,
  onWindowChange,
  onRoleChange,
  onScopeChange,
  onClose,
}: {
  timeWindow: LeaderboardWindow;
  role: LeaderboardRole;
  scope: LeaderboardScope;
  onWindowChange: (next: LeaderboardWindow) => void;
  onRoleChange: (next: LeaderboardRole) => void;
  onScopeChange: (next: LeaderboardScope) => void;
  onClose: () => void;
}) {
  const { data, error, retry } = useLeaderboards(timeWindow, role, scope);
  const setConditions = useFilterStore((s) => s.setConditions);

  const select = (kind: LeaderboardKind, entry: LeaderboardEntry) => {
    setConditions([leaderboardFilterCondition(kind, role, entry)]);
    onClose();
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-3 shrink-0">
        <SegmentedGroup
          label="Time window"
          options={LEADERBOARD_WINDOWS}
          value={timeWindow}
          onChange={onWindowChange}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SegmentedGroup
            label="Entity scope"
            options={LEADERBOARD_SCOPES}
            value={scope}
            onChange={onScopeChange}
          />
          <SegmentedGroup
            label="Role"
            options={LEADERBOARD_ROLES}
            value={role}
            onChange={onRoleChange}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4 min-h-164">
        {data ? (
          <div className="grid grid-cols-3 gap-x-6 gap-y-5">
            {LEADERBOARD_KINDS.map((k) => (
              <LeaderboardBoard
                key={k.key}
                kind={k.key}
                label={k.label}
                entries={data[k.key]}
                onSelect={(entry) => select(k.key, entry)}
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2">
            <p className="text-xs text-fg-subtle">
              Couldn&apos;t load leaderboards.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="btn-glass"
              onClick={retry}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div role="status" aria-label="Loading leaderboards">
            <span className="sr-only">Loading leaderboards…</span>
            <div className="grid grid-cols-3 gap-x-6 gap-y-5">
              {LEADERBOARD_KINDS.map((k) => (
                <LeaderboardBoardSkeleton key={k.key} label={k.label} />
              ))}
            </div>
          </div>
        )}
      </div>
      <p className="px-5 py-2 border-t border-border shrink-0 text-2xs text-fg-subtle">
        {data?.computed_at != null ? (
          `Data current as of ${formatAbsoluteUTC(data.computed_at)} UTC.`
        ) : (
          <>&nbsp;</>
        )}
      </p>
    </>
  );
}
