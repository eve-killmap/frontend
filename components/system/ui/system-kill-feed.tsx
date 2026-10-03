import React, { useEffect, useState } from "react";
import { SystemData, TypeData } from "@/lib/schema/system-schema";
import { LiveKill } from "@/lib/schema/base-schema";
import { useSystemKillFeedStore } from "@/stores/system/system-kill-feed-store";
import { useLiveKillStore } from "@/stores/live-kill-store";
import { ChevronDown, FilterX } from "lucide-react";
import { findNearestObject } from "@/lib/system/find-nearest-object";
import { formatDistance } from "@/lib/formatting/format-distance";
import { formatRelativeTime } from "@/lib/formatting/time";
import { animateToPosFn } from "@/lib/camera-functions";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { CAPSULE_IDS } from "@/lib/eve/capsule-ids";
import { Panel, PanelHeader, PanelTitle } from "@/components/common/panel";
import {
  FIGHTER_CARD_IMAGE_SIZE,
  FighterCard,
} from "@/components/common/fighter-card";
import { KillInfo } from "@/components/common/kill-info";
import { Flag } from "@/components/common/flag";
import { getEntityInfo, killmailZkillUrl } from "@/lib/eve/eve-images";
import { useFilterConditions } from "@/stores/filter-store";
import { killMatchesFilter } from "@/lib/filter/match-live-kill";
import { killPassesViewFilters } from "@/lib/kill/kill-filter";
import { useKillStore } from "@/stores/kill-store";
import { useLocatedKillStore } from "@/stores/system/located-kill-store";

const KillEntry = React.memo(function KillEntry({
  kill,
  now,
  systemData,
  typeData,
  filtered,
}: {
  kill: LiveKill;
  now: number;
  systemData: SystemData;
  typeData: TypeData;
  filtered: boolean;
}) {
  const setLocated = useLocatedKillStore((s) => s.setLocated);
  const clearLocated = useLocatedKillStore((s) => s.clearLocated);

  const victimUrls = getEntityInfo(
    {
      characterId: kill.v_character_id,
      corporationId: kill.v_corporation_id,
      allianceId: kill.v_alliance_id,
      factionId: kill.v_faction_id,
    },
    FIGHTER_CARD_IMAGE_SIZE,
  );

  const fbUrls = getEntityInfo(
    {
      characterId: kill.fb_character_id,
      corporationId: kill.fb_corporation_id,
      allianceId: kill.fb_alliance_id,
      factionId: kill.fb_faction_id,
      shipTypeId: kill.fb_ship_type_id,
    },
    FIGHTER_CARD_IMAGE_SIZE,
  );

  return (
    <div
      className={`border-b border-border/50 last:border-0 ${filtered ? "opacity-40" : ""}`}
    >
      <div className="px-2 pt-1.5 pb-1 text-3xs text-fg-muted leading-3">
        {filtered && (
          <span
            title="Hidden by active filter"
            className="inline-flex items-center align-middle mr-1 text-fg-subtle"
          >
            <FilterX size={10} />
          </span>
        )}
        <span>{formatRelativeTime(kill.killmail_time, now)}</span>
        {(() => {
          const killLoc: [number, number, number] = [kill.x, kill.y, kill.z];
          const nearest = findNearestObject(
            killLoc,
            systemData,
            typeData.typeRadii,
          );
          if (!nearest) return null;
          return (
            <>
              <span className="px-1">·</span>
              <span
                role="button"
                tabIndex={0}
                onMouseEnter={() => setLocated(killLoc)}
                onMouseLeave={clearLocated}
                onClick={() => animateToPosFn?.(killLoc)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    animateToPosFn?.(killLoc);
                  }
                }}
                className="font-semibold hover:text-fg-secondary cursor-pointer"
              >
                {formatDistance(nearest.distance)} from {nearest.name}
              </span>
            </>
          );
        })()}
        {kill.solo || kill.npc || kill.awox ? (
          <>
            <span className="px-1">·</span>
            <span className="inline-flex align-middle gap-1">
              {kill.solo && <Flag>Solo</Flag>}
              {kill.npc && <Flag>NPC</Flag>}
              {kill.awox && <Flag>Awox</Flag>}
            </span>
          </>
        ) : null}
      </div>

      <div className="flex items-stretch px-2 pb-2">
        <FighterCard
          label="Victim"
          className="flex-1 border-r border-border/50 pr-1.5"
          portrait={victimUrls.portraitUrl}
          shipTypeId={kill.v_ship_type_id}
          shipName={kill.v_ship_name}
          zKillUrl={victimUrls.zkillUrl}
          name={kill.v_character_name ?? "Unknown"}
          corp={kill.v_corporation_name ?? null}
          alliance={kill.v_alliance_name ?? null}
          faction={kill.v_faction_name ?? null}
        />
        <FighterCard
          label="Final Blow"
          className="flex-1 border-r border-border/50 px-1.5"
          portrait={fbUrls.portraitUrl}
          shipTypeId={kill.fb_ship_type_id}
          shipName={kill.fb_ship_name}
          zKillUrl={fbUrls.zkillUrl}
          name={kill.fb_character_name ?? "Unknown"}
          corp={kill.fb_corporation_name ?? null}
          alliance={kill.fb_alliance_name ?? null}
          faction={kill.fb_faction_name ?? null}
        />
        <KillInfo
          label="Value"
          className="w-16 shrink-0 pl-1.5"
          destroyedValue={kill.destroyed_value}
          droppedValue={kill.dropped_value}
          totalValue={kill.total_value}
          zKillUrl={killmailZkillUrl(kill.killmail_id)}
        />
      </div>
    </div>
  );
});

export const SystemKillFeed = React.memo(function SystemKillFeed({
  systemData,
  typeData,
  minimized,
  onToggleMinimize,
  className = "",
}: {
  systemData: SystemData;
  typeData: TypeData;
  minimized: boolean;
  onToggleMinimize: () => void;
  className?: string;
}) {
  const kills = useSystemKillFeedStore((s) => s.kills);
  const connected = useLiveKillStore((s) => s.connected);
  const [now, setNow] = useState(() => Date.now());

  const showCapsulesInFeed = useSystemSettingsStore(
    (s) => s.showCapsulesInFeed,
  );
  const shipTypes = useSystemSettingsStore((s) => s.shipTypes);
  const rangeFilter = useKillStore((s) => s.rangeFilter);
  const conditions = useFilterConditions();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Panel className={className}>
      <PanelHeader>
        <PanelTitle>Live Kill Feed</PanelTitle>
        <div className="flex items-center gap-2">
          <span
            className={`w-1.5 h-1.5 rounded-full animate-pulse ${connected ? "bg-green-400" : "bg-red-500"}`}
          />
          <button
            onClick={onToggleMinimize}
            aria-label={
              minimized ? "Expand live kill feed" : "Minimize live kill feed"
            }
            className="text-fg-subtle hover:text-fg-secondary cursor-pointer"
          >
            <ChevronDown
              size={12}
              className={`size-3.5 transition-transform ${minimized ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </PanelHeader>

      {!minimized && (
        <div className="flex-1 min-h-0 overflow-y-auto">
          {kills.length === 0 ? (
            <p className="text-2xs text-fg-subtle italic px-3 py-3">
              Waiting for kills...
            </p>
          ) : (
            kills
              .filter((kill) => {
                if (!showCapsulesInFeed)
                  return !CAPSULE_IDS.includes(kill.v_ship_type_id);
                return true;
              })
              .map((kill) => (
                <KillEntry
                  key={kill.killmail_id}
                  kill={kill}
                  now={now}
                  systemData={systemData}
                  typeData={typeData}
                  filtered={
                    !killMatchesFilter(kill, conditions) ||
                    !killPassesViewFilters(kill, shipTypes, rangeFilter)
                  }
                />
              ))
          )}
        </div>
      )}
    </Panel>
  );
});
