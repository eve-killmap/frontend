import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useKillHoverStore } from "@/stores/system/kill-hover-store";
import { TypeData } from "@/lib/schema/system-schema";
import { KillDetail } from "@/lib/schema/system-schema";
import { SystemData } from "@/lib/schema/system-schema";
import { KillDetailSchema } from "@/lib/schema/system-schema.zod";
import { Card, CardContent } from "@/components/ui/card";
import { findNearestObject } from "@/lib/system/find-nearest-object";
import { formatDistance } from "@/lib/formatting/format-distance";
import { formatIsk } from "@/lib/formatting/format-isk";
import { formatRelativeTime, formatAbsoluteUTC } from "@/lib/formatting/time";
import { API_BASE } from "@/lib/net/endpoints";
import { apiFetch } from "@/lib/api/client";
import { Flag } from "@/components/common/flag";

function withTicker(
  name: string | undefined,
  ticker: string | undefined,
): string | null {
  if (!name) return null;
  return ticker ? `${name} [${ticker}]` : name;
}

function shipIconNudge(shipIconFile: string | null): number {
  if (!shipIconFile) return 0;
  const f = shipIconFile.toLowerCase();
  if (
    f.startsWith("capsule") ||
    f.startsWith("shuttle") ||
    f.startsWith("rookie")
  )
    return 2;
  if (f.includes("frigate")) return 1;
  return 0;
}

function positionCard(
  el: HTMLDivElement,
  mouseX: number,
  mouseY: number,
  size: { width: number; height: number },
) {
  const pad = 8;
  let left = mouseX + 16;
  let top = mouseY + 16;
  if (size.width > 0) {
    left = Math.min(left, window.innerWidth - size.width - pad);
    top = Math.min(top, window.innerHeight - size.height - pad);
    left = Math.max(left, pad);
    top = Math.max(top, pad);
  }
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

interface KillHoverCardProps {
  typeData: TypeData;
  systemData: SystemData;
}

export function KillHoverCard({ typeData, systemData }: KillHoverCardProps) {
  const killId = useKillHoverStore((s) => s.killId);
  const shipTypeId = useKillHoverStore((s) => s.shipTypeId);
  const killTime = useKillHoverStore((s) => s.killTime);
  const killPosition = useKillHoverStore((s) => s.killPosition);

  const [visible, setVisible] = useState(false);
  const [detail, setDetail] = useState<KillDetail | null>(null);
  const [fetchError, setFetchError] = useState(false);

  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastKillId = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!cardRef.current || !visible) return;
    sizeRef.current = {
      width: cardRef.current.offsetWidth,
      height: cardRef.current.offsetHeight,
    };
    const { mouseX, mouseY } = useKillHoverStore.getState();
    positionCard(cardRef.current, mouseX, mouseY, sizeRef.current);
  }, [detail, visible]);

  useEffect(() => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (killId === null) {
      setVisible(false);
      setDetail(null);
      return;
    }

    if (killId !== lastKillId.current) {
      setDetail(null);
      setFetchError(false);
      lastKillId.current = killId;
    }

    showTimerRef.current = setTimeout(() => {
      setVisible(true);

      const controller = new AbortController();
      abortRef.current = controller;

      (async () => {
        try {
          const data = await apiFetch(
            `${API_BASE}/kills/details/processed?killmail_id=${killId}`,
            KillDetailSchema,
            { signal: controller.signal },
          );
          setDetail(data);
        } catch (e) {
          if (e instanceof Error && e.name === "AbortError") return;
          setFetchError(true);
        }
      })();
    }, 150);

    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
    };
  }, [killId]);

  if (!visible || killId === null) return null;

  const isNPCLoss = shipTypeId ? typeData.npcTypes.includes(shipTypeId) : false;
  const shipTypeName = shipTypeId
    ? typeData.typeNames[String(shipTypeId)]
    : null;
  const shipIconId =
    shipTypeId != null ? typeData.typeBrackets[String(shipTypeId)] : null;
  const shipIconFile =
    shipIconId != null ? typeData.brackets[String(shipIconId)] : null;
  const shipIconSrc = shipIconFile
    ? `/brackets/${shipIconFile.toLowerCase()}`
    : null;
  const iconNudge = shipIconNudge(shipIconFile);

  return (
    <Card
      ref={cardRef}
      className="fixed bg-panel border-border min-w-64 max-w-75 py-3 pointer-events-none z-hovercard"
      style={{ left: -9999, top: -9999 }}
    >
      <HoverCardPositioner cardRef={cardRef} sizeRef={sizeRef} />
      <CardContent className="px-3 space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 min-w-0">
            {shipIconSrc &&
              (isNPCLoss ? (
                <span
                  className="relative shrink-0 inline-flex"
                  style={{ width: 16, height: 16, top: iconNudge }}
                >
                  <span
                    className="absolute inset-0"
                    style={{
                      backgroundColor: "var(--color-hostile)",
                      opacity: 0.4,
                      WebkitMaskImage: "url(/brackets/bracketbackground.png)",
                      WebkitMaskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskImage: "url(/brackets/bracketbackground.png)",
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                    }}
                  />
                  <span
                    className="absolute inset-0"
                    style={{
                      backgroundColor: "var(--color-hostile)",
                      WebkitMaskImage: `url(${shipIconSrc})`,
                      WebkitMaskSize: "contain",
                      WebkitMaskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskImage: `url(${shipIconSrc})`,
                      maskSize: "contain",
                      maskRepeat: "no-repeat",
                      maskPosition: "center",
                    }}
                  />
                </span>
              ) : (
                <img
                  src={shipIconSrc}
                  alt=""
                  width={16}
                  height={16}
                  className="relative shrink-0"
                  style={{ top: iconNudge }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display =
                      "none";
                  }}
                />
              ))}
            <span className="text-foreground font-semibold text-xs leading-tight truncate min-w-0">
              {shipTypeName ?? "Unknown Ship"}
            </span>
            {detail?.solo && <Flag>Solo</Flag>}
            {detail?.npc && <Flag>NPC</Flag>}
            {detail?.awox && <Flag>Awox</Flag>}
          </div>
          {killTime && (
            <span className="text-fg-faint text-2xs shrink-0">
              {formatRelativeTime(killTime)}
            </span>
          )}
        </div>

        {detail ? (
          <>
            <Section label="Victim">
              <Primary>{detail.victim.character}</Primary>
              <Secondary
                parts={[
                  withTicker(
                    detail.victim.character_corporation,
                    detail.victim.character_corporation_ticker,
                  ),
                  withTicker(
                    detail.victim.character_alliance,
                    detail.victim.character_alliance_ticker,
                  ),
                  detail.victim.character_faction,
                ]}
              />
              <Secondary
                parts={[
                  `${detail.victim.damage_taken.toLocaleString()} damage taken`,
                ]}
              />
            </Section>

            <Section label="Final blow">
              <Primary>{detail.final_blow.character}</Primary>
              <Secondary
                parts={[
                  withTicker(
                    detail.final_blow.character_corporation,
                    detail.final_blow.character_corporation_ticker,
                  ),
                  withTicker(
                    detail.final_blow.character_alliance,
                    detail.final_blow.character_alliance_ticker,
                  ),
                  detail.final_blow.character_faction,
                ]}
              />
              <Secondary
                parts={[
                  detail.final_blow.ship,
                  detail.final_blow.weapon,
                  `${detail.final_blow.damage_done.toLocaleString()} damage dealt`,
                ]}
              />
            </Section>

            <Section label="Top damage">
              {detail.final_blow_is_top_damage ? (
                <span className="text-fg-subtle text-2xs italic">
                  Same as final blow
                </span>
              ) : (
                <>
                  <Primary>{detail.top_damage.character}</Primary>
                  <Secondary
                    parts={[
                      withTicker(
                        detail.top_damage.character_corporation,
                        detail.top_damage.character_corporation_ticker,
                      ),
                      withTicker(
                        detail.top_damage.character_alliance,
                        detail.top_damage.character_alliance_ticker,
                      ),
                      detail.top_damage.character_faction,
                    ]}
                  />
                  <Secondary
                    parts={[
                      detail.top_damage.ship,
                      detail.top_damage.weapon,
                      `${detail.top_damage.damage_done.toLocaleString()} damage dealt`,
                    ]}
                  />
                </>
              )}
            </Section>

            {detail.total_value != null && (
              <Section label="Value">
                <Primary>{formatIsk(detail.total_value)} ISK</Primary>
                <Secondary
                  parts={[
                    detail.dropped_value != null
                      ? `${formatIsk(detail.dropped_value)} dropped`
                      : null,
                    detail.destroyed_value != null
                      ? `${formatIsk(detail.destroyed_value)} destroyed`
                      : null,
                  ]}
                />
              </Section>
            )}

            {detail.war_id &&
              (detail.war_info ? (
                (() => {
                  const {
                    aggressor,
                    defender,
                    declared,
                    finished,
                    retracted,
                    started,
                    mutual,
                  } = detail.war_info!;
                  const aggressorName =
                    withTicker(
                      aggressor.alliance ?? aggressor.corporation,
                      aggressor.alliance_ticker ?? aggressor.corporation_ticker,
                    ) ?? "Unknown";
                  const defenderName =
                    withTicker(
                      defender.alliance ?? defender.corporation,
                      defender.alliance_ticker ?? defender.corporation_ticker,
                    ) ?? "Unknown";
                  const status = finished
                    ? "Ended"
                    : retracted
                      ? "Retracted"
                      : started
                        ? "Active, started"
                        : "Pending as of";
                  const statusDate = formatRelativeTime(
                    finished ?? retracted ?? started ?? declared,
                  );
                  return (
                    <Section label="War Info">
                      <div className="flex items-baseline justify-between">
                        <Primary>{aggressorName}</Primary>
                        <span className="text-fg-subtle text-2xs shrink-0 pb-0.5">
                          {aggressor.ships_killed} killed
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between leading-tight">
                        <span className="text-fg-faint text-2xs pb-0.5">
                          vs {defenderName}
                        </span>
                        <span className="text-fg-subtle text-2xs shrink-0 pb-0.5">
                          {defender.ships_killed} killed
                        </span>
                      </div>
                      <Secondary
                        parts={[
                          `${status} ${statusDate}`,
                          mutual ? "Mutual" : null,
                        ]}
                      />
                    </Section>
                  );
                })()
              ) : (
                <Section label="War">
                  <span className="text-fg-subtle text-2xs italic">
                    Associated with a war, but war info is unavailable
                  </span>
                </Section>
              ))}

            <div className="border-t border-border/60 pt-1 text-2xs text-fg-subtle leading-tight space-y-0.5">
              <div>
                {detail.attackers} attacker{detail.attackers !== 1 ? "s" : ""}
              </div>
              {killPosition &&
                (() => {
                  const nearest = findNearestObject(
                    killPosition,
                    systemData,
                    typeData.typeRadii,
                  );
                  if (!nearest) return null;
                  return (
                    <div>
                      {formatDistance(nearest.distance)} from {nearest.name}
                    </div>
                  );
                })()}
              {killTime && <div>{formatAbsoluteUTC(killTime)} UTC</div>}
            </div>
          </>
        ) : fetchError ? (
          <div className="border-t border-border/60 pt-2 text-2xs text-red-400/70">
            Failed to load kill details
          </div>
        ) : (
          <div className="border-t border-border/60 pt-2 text-2xs text-fg-subtle">
            Loading...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HoverCardPositioner({
  cardRef,
  sizeRef,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  sizeRef: React.RefObject<{ width: number; height: number }>;
}) {
  const mouseX = useKillHoverStore((s) => s.mouseX);
  const mouseY = useKillHoverStore((s) => s.mouseY);
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    positionCard(el, mouseX, mouseY, sizeRef.current);
  }, [mouseX, mouseY, cardRef, sizeRef]);
  return null;
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-border/60 pt-2">
      <div className="text-3xs uppercase tracking-wider text-fg-subtle mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function Primary({ children }: { children: React.ReactNode }) {
  return <div className="text-fg-strong text-xs pb-0.5">{children}</div>;
}

function Secondary({ parts }: { parts: (string | null | undefined)[] }) {
  const joined = parts.filter(Boolean).join(" · ");
  if (!joined) return null;
  return (
    <div className="text-fg-faint text-2xs pb-0.5 leading-tight">{joined}</div>
  );
}
