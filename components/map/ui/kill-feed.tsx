import React, { useEffect, useMemo, useState } from "react";
import { LiveKill } from "@/lib/schema/base-schema";
import { useKillFeedStore } from "@/stores/map/kill-feed-store";
import { SystemsData } from "@/lib/schema/map-schema";
import { slugify } from "@/lib/formatting/slugify";
import { AppLink } from "@/components/common/app-link";
import { formatRelativeTime } from "@/lib/formatting/time";
import { FilterX } from "lucide-react";
import { useMapStore } from "@/stores/map/map-store";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { isTriglavianSystem } from "@/lib/map/triglavian";
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
import { useHighlightedSystemStore } from "@/stores/map/highlighted-system-store";
import { useLiveKillStore } from "@/stores/live-kill-store";

interface KillEntryProps {
  kill: LiveKill;
  systemName: string | undefined;
  now: number;
  filtered: boolean;
  triglavianFont: boolean;
}

const KillEntry = React.memo(function KillEntry({
  kill,
  systemName,
  now,
  filtered,
  triglavianFont,
}: KillEntryProps) {
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

  const victimName = kill.v_character_name ?? "Unknown";
  const victimCorp = kill.v_corporation_name ?? null;
  const victimAlliance = kill.v_alliance_name ?? null;
  const victimFaction = kill.v_faction_name ?? null;
  const fbName = kill.fb_character_name ?? "Unknown";
  const fbCorp = kill.fb_corporation_name ?? null;
  const fbAlliance = kill.fb_alliance_name ?? null;
  const fbFaction = kill.fb_faction_name ?? null;

  const setHighlight = useHighlightedSystemStore((s) => s.setHighlightedSystem);

  const showTriglavian =
    triglavianFont && isTriglavianSystem(kill.solar_system_id);

  return (
    <div
      className={`border-b border-border/50 last:border-0 ${filtered ? "opacity-40" : ""}`}
      onMouseEnter={() => setHighlight(kill.solar_system_id)}
      onMouseLeave={() => setHighlight(null)}
    >
      <div className="flex items-center justify-start gap-2 px-2 pt-1.5 pb-1 text-fg-muted">
        {filtered && (
          <span
            title="Hidden by active filter"
            className="inline-flex items-center text-fg-subtle"
          >
            <FilterX size={10} />
          </span>
        )}
        <span className="text-3xs leading-3">
          {formatRelativeTime(kill.killmail_time, now)}
        </span>
        <span className="text-3xs leading-3">·</span>
        {systemName ? (
          <AppLink
            to={`/${slugify(systemName)}?kill=${kill.killmail_id}`}
            className={`text-3xs font-semibold hover:text-fg-secondary cursor-pointer leading-3 tracking-wide ${showTriglavian ? "font-triglavian" : ""}`}
          >
            {systemName}
          </AppLink>
        ) : (
          <span className="text-3xs font-semibold leading-3">
            Unknown system
          </span>
        )}
        {kill.solo || kill.npc || kill.awox ? (
          <span className="px-1 text-3xs leading-3">·</span>
        ) : null}
        {kill.solo && <Flag>Solo</Flag>}
        {kill.npc && <Flag>NPC</Flag>}
        {kill.awox && <Flag>Awox</Flag>}
      </div>

      <div className="flex items-stretch px-2 pb-2">
        <FighterCard
          label="Victim"
          className="flex-1 border-r border-border/50 pr-1.5"
          portrait={victimUrls.portraitUrl}
          shipTypeId={kill.v_ship_type_id}
          shipName={kill.v_ship_name}
          zKillUrl={victimUrls.zkillUrl}
          name={victimName}
          corp={victimCorp}
          alliance={victimAlliance}
          faction={victimFaction}
        />
        <FighterCard
          label="Final Blow"
          className="flex-1 border-r border-border/50 px-1.5"
          portrait={fbUrls.portraitUrl}
          shipTypeId={kill.fb_ship_type_id}
          shipName={kill.fb_ship_name}
          zKillUrl={fbUrls.zkillUrl}
          name={fbName}
          corp={fbCorp}
          alliance={fbAlliance}
          faction={fbFaction}
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

interface KillFeedProps {
  systemsData: SystemsData;
}

export function KillFeed({ systemsData }: KillFeedProps) {
  const kills = useKillFeedStore((s) => s.kills);
  const connected = useLiveKillStore((s) => s.connected);
  const [now, setNow] = useState(() => Date.now());

  const showCapsulesInFeed = useMapStore((s) => s.showCapsulesInFeed);
  const triglavianFont = useGlobalSettingsStore((s) => s.triglavianFont);
  const conditions = useFilterConditions();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  const systemNameMap = useMemo(() => {
    const map = new Map<number, string>();
    systemsData.systemIDs.forEach((id, i) =>
      map.set(id, systemsData.systems[i]),
    );
    return map;
  }, [systemsData]);

  return (
    <Panel className="flex-1 min-h-0">
      <PanelHeader>
        <PanelTitle>Live Kill Feed</PanelTitle>
        <span
          className={`w-1.5 h-1.5 rounded-full animate-pulse ${connected ? "bg-green-400" : "bg-red-500"}`}
        />
      </PanelHeader>

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
                systemName={systemNameMap.get(kill.solar_system_id)}
                now={now}
                filtered={
                  conditions.length > 0 && !killMatchesFilter(kill, conditions)
                }
                triglavianFont={triglavianFont}
              />
            ))
        )}
      </div>
    </Panel>
  );
}
