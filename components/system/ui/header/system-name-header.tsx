import React, { useEffect, useMemo, useState } from "react";
import { Pin } from "lucide-react";
import { ExternalLink } from "@/components/common/external-link";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { SystemData } from "@/lib/schema/system-schema";
import { apiFetch, ApiError } from "@/lib/api/client";
import { SovDataSchema } from "@/lib/schema/system-schema.zod";
import { API_BASE } from "@/lib/net/endpoints";
import { BuildInfo } from "@/lib/schema/base-schema";
import { slugify } from "@/lib/formatting/slugify";
import {
  useSystemHistoryStore,
  useIsPinned,
} from "@/stores/system/system-history-store";
import {
  wormholeClassLabel,
  displayWormholeClassLabel,
  wormholeEffectLabel,
} from "@/lib/map/wormhole";
import {
  formatSecurity,
  securityIndex,
  WORMHOLE_CLASS_HEX,
  wormholeEffectHex,
} from "@/lib/map/system-colors";
import { isTriglavianSystem } from "@/lib/map/triglavian";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { formatAbsoluteUTC } from "@/lib/formatting/time";

interface SystemNameHeaderProps {
  sdeInfo: BuildInfo;
  systemData: SystemData;
  jumps: number | null;
}

export const SystemNameHeader = React.memo(function SystemNameHeader({
  sdeInfo,
  systemData,
  jumps,
}: SystemNameHeaderProps) {
  const [hovering, setHovering] = useState(false);
  const triglavianFont = useGlobalSettingsStore((s) => s.triglavianFont);
  const triglavian = isTriglavianSystem(systemData.solarSystemID);
  const nameFontClass = triglavian && triglavianFont ? "font-triglavian" : "";
  const [sovName, setSovName] = useState<string | null>(null);
  const [adm, setADM] = useState<number | null>(null);
  const [vulnerableTime, setVulnerableTime] = useState<string | null>(null);

  const slug = useMemo(() => slugify(systemData.name), [systemData.name]);
  const pinned = useIsPinned(slug);
  const togglePin = useSystemHistoryStore((s) => s.togglePin);

  const sec = systemData.securityStatus;
  const secColor = securityIndex(sec);

  const wormholeClassID = systemData.wormholeClassID;
  const isWormhole = wormholeClassID != null;
  const classLabel =
    wormholeClassID != null ? wormholeClassLabel(wormholeClassID) : null;
  const slotClassLabel =
    wormholeClassID != null
      ? displayWormholeClassLabel(wormholeClassID, systemData.name)
      : null;
  const classHex =
    wormholeClassID != null ? WORMHOLE_CLASS_HEX[wormholeClassID] : undefined;
  const effectLabel = wormholeEffectLabel(systemData.wormholeEffect ?? 0);
  const effectHex = wormholeEffectHex(systemData.wormholeEffect ?? 0);

  useEffect(() => {
    if (systemData.sovFactionName) {
      setSovName(systemData.sovFactionName);
      return;
    }

    const controller = new AbortController();
    apiFetch(
      `${API_BASE}/systems/${systemData.solarSystemID}/sov`,
      SovDataSchema,
      { signal: controller.signal },
    )
      .then((data) => {
        if (data.claimed) {
          if (data.alliance) {
            setSovName(`${data.alliance.name} (${data.alliance.ticker})`);
          }
          if (data.adm) {
            setADM(data.adm);
          }
          setVulnerableTime(
            `${formatAbsoluteUTC(data.vulnerable_start)} - ${formatAbsoluteUTC(data.vulnerable_end)}`,
          );
        } else {
          setSovName("None");
        }
      })
      .catch((e) => {
        if (e instanceof ApiError) setSovName("None");
      });

    return () => controller.abort();
  }, [systemData.solarSystemID, systemData.sovFactionName]);

  const { moons, belts, stations } = useMemo(() => {
    let moons = 0,
      belts = 0,
      stations = 0;
    if (systemData.planets) {
      for (const planet of systemData.planets) {
        if (planet.moons) {
          moons += planet.moons.length;
          for (const moon of planet.moons) {
            if (moon.stations) stations += moon.stations.length;
          }
        }
        if (planet.asteroidBelts) belts += planet.asteroidBelts.length;
        if (planet.stations) stations += planet.stations.length;
      }
    }
    return { moons, belts, stations };
  }, [systemData]);

  return (
    <div className="relative flex flex-col items-center gap-0.5 w-fit pointer-events-auto">
      <div className="relative flex items-center">
        <ExternalLink
          href={`https://zkillboard.com/system/${systemData.solarSystemID}/`}
          className="flex items-baseline gap-2 cursor-pointer group"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          onFocus={() => setHovering(true)}
          onBlur={() => setHovering(false)}
        >
          <span
            className={`text-2xl font-bold text-foreground tracking-wide drop-shadow-lg group-hover:text-fg-strong transition-colors ${nameFontClass}`}
          >
            {systemData.name}
          </span>
          {slotClassLabel ? (
            <span
              className="text-base font-mono font-semibold drop-shadow"
              style={{ color: classHex }}
            >
              {slotClassLabel}
              <span
                className={`ml-1 text-xs font-normal text-fg-muted text-security-${secColor}`}
              >
                {formatSecurity(sec)}
              </span>
            </span>
          ) : (
            <span
              className={`text-sm font-mono font-semibold text-security-${secColor} drop-shadow`}
            >
              {formatSecurity(sec)}
            </span>
          )}
        </ExternalLink>
        <button
          aria-label={pinned ? "Unpin this system" : "Pin this system"}
          title={pinned ? "Unpin this system" : "Pin this system"}
          onClick={() => togglePin(slug)}
          className="absolute left-full top-1/2 ml-2 -translate-y-1/2 cursor-pointer transition-colors"
        >
          <Pin
            className={`size-4 ${pinned ? "fill-current text-capsuleer" : "text-fg-subtle hover:text-capsuleer"}`}
          />
        </button>
      </div>
      <div
        className={`text-xs text-fg-muted tracking-widest uppercase select-none ${nameFontClass}`}
      >
        {systemData.constellationName}&ensp;·&ensp;{systemData.regionName}
        {effectLabel && (
          <>
            &ensp;·&ensp;<span style={{ color: effectHex }}>{effectLabel}</span>
          </>
        )}
      </div>
      {hovering && (
        <Card className="absolute top-full mt-2 w-80 max-w-[calc(100vw-2rem)] panel-glass z-overlay">
          <CardContent className="px-3">
            <div className="space-y-1.5">
              <div className="space-y-1 pt-1 text-sm">
                <Label className="text-base text-fg-secondary text-center block">
                  System Info
                </Label>
                <Row
                  label="Security Status"
                  value={String(Math.round(sec * 100) / 100)}
                />
                {isWormhole && classLabel && (
                  <Row label="Wormhole Class" value={classLabel} />
                )}
                {isWormhole && (
                  <Row label="Wormhole Effect" value={effectLabel ?? "None"} />
                )}
                {sovName && <Row label="Sovereignty" value={sovName} />}
                {adm && <Row label="ADM" value={String(adm)} />}
                {vulnerableTime && (
                  <Row label="Vulnerable Window" value={vulnerableTime} />
                )}
                {jumps != null && (
                  <Row
                    label="Jumps (past hour)"
                    value={jumps.toLocaleString()}
                  />
                )}
                <Row
                  label="System ID"
                  value={systemData.solarSystemID.toString()}
                />
              </div>
              <div className="space-y-1 pt-1 text-sm">
                <Label className="text-base text-fg-secondary text-center block">
                  Celestials
                </Label>
                <Row
                  label="Planets"
                  value={String(systemData.planets?.length ?? 0)}
                />
                <Row label="Moons" value={String(moons)} />
                <Row label="Asteroid Belts" value={String(belts)} />
                <Row label="NPC Stations" value={String(stations)} />
                <Row
                  label="Stargates"
                  value={String(systemData.stargates?.length ?? 0)}
                />
              </div>
              <div className="space-y-1 pt-1 text-sm">
                <Label className="text-base text-fg-secondary text-center block">
                  SDE Info
                </Label>
                <Row label="Build Number" value={String(sdeInfo.buildNumber)} />
                <Row
                  label="Release Date"
                  value={formatTime(sdeInfo.releaseDate)}
                />
                <Row label="Build Time" value={formatTime(sdeInfo.buildTime)} />
              </div>
              <p className="text-xs text-fg-subtle text-center">
                Click to open the zKillboard page for this system.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-fg-muted">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}

function formatTime(time: string): string {
  const formatted = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  }).format(new Date(time));
  return formatted;
}
