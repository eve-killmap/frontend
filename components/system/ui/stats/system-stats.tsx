import React, { Suspense, lazy, use, useEffect, useState } from "react";
import type { PlotParams } from "react-plotly.js";
import type { Layout, Config } from "plotly.js";
import { BarChart2 } from "lucide-react";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { SystemData } from "@/lib/schema/system-schema";
import { ZkillSystemStats } from "@/lib/schema/system-schema";
import { parseZkillSystemStats } from "@/lib/schema/zkill-stats";
import { formatIsk } from "@/lib/formatting/format-isk";
import { CHART } from "@/lib/theme-colors";
import { resolveNames } from "@/lib/api/universe-names";
import { apiFetch } from "@/lib/api/client";
import {
  characterPortraitUrl,
  corporationLogoUrl,
  allianceLogoUrl,
  characterZkillUrl,
  corporationZkillUrl,
  allianceZkillUrl,
  locationZkillUrl,
} from "@/lib/eve/eve-images";

type StatsResult = { ok: true; data: ZkillSystemStats } | { ok: false };

const PlotLazy = lazy(() => import("./plotly-cartesian"));

function Plot(props: PlotParams) {
  return (
    <Suspense fallback={null}>
      <PlotLazy {...props} />
    </Suspense>
  );
}

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DARK_LAYOUT: Partial<Layout> = {
  paper_bgcolor: CHART.PAPER_BG,
  plot_bgcolor: CHART.PAPER_BG,
  font: { color: CHART.FONT, size: 11, family: "Space Mono, monospace" },
  margin: { l: 55, r: 30, t: 30, b: 50 },
  xaxis: {
    gridcolor: CHART.GRID,
    zerolinecolor: CHART.ZEROLINE,
    linecolor: CHART.AXIS_LINE,
    tickcolor: CHART.AXIS_LINE,
  },
  yaxis: {
    gridcolor: CHART.GRID,
    zerolinecolor: CHART.ZEROLINE,
    linecolor: CHART.AXIS_LINE,
    tickcolor: CHART.AXIS_LINE,
  },
  legend: {
    bgcolor: CHART.PAPER_BG,
    bordercolor: CHART.AXIS_LINE,
    borderwidth: 1,
  },
};

const PLOT_CONFIG: Partial<Config> = {
  displaylogo: false,
  responsive: true,
  modeBarButtonsToRemove: ["sendDataToCloud", "lasso2d", "select2d"],
};

function formatKills(value: number | undefined): string {
  if (!value) return "0";
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

interface SystemStatsProps {
  systemData: SystemData;
  open: boolean;
  onToggle: () => void;
}

export const SystemStats = React.memo(function SystemStats({
  systemData,
  open,
  onToggle,
}: SystemStatsProps) {
  const [statsPromise, setStatsPromise] = useState<Promise<StatsResult> | null>(
    null,
  );

  useEffect(() => {
    if (!open || statsPromise !== null) return;
    setStatsPromise(
      (async (): Promise<StatsResult> => {
        try {
          const raw = await apiFetch(
            `https://zkillboard.com/api/stats/solarSystemID/${systemData.solarSystemID}/`,
            z.unknown(),
          );
          const data = parseZkillSystemStats(raw);
          if (!data) return { ok: false };
          return { ok: true, data };
        } catch {
          return { ok: false };
        }
      })(),
    );
  }, [open, systemData.solarSystemID, statsPromise]);

  return (
    <div className="pointer-events-auto">
      <Dialog open={open} onOpenChange={onToggle}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="lg"
            className="btn-glass"
            title="Stats"
          >
            <BarChart2 />
            <span className="btn-label">Stats</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[90vw] h-[85vh] rounded-none p-0 gap-0 overflow-hidden flex flex-col">
          <div className="flex items-center px-5 py-3 border-b border-border shrink-0">
            <DialogTitle className="text-foreground font-semibold text-lg">
              {systemData.name} Statistics
              <span className="text-fg-faint font-light text-sm">
                &nbsp;&nbsp;&nbsp;Powered by zKillboard
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Kill statistics for {systemData.name}.
            </DialogDescription>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {statsPromise ? (
              <Suspense fallback={<StatsSkeleton />}>
                <StatsContent promise={statsPromise} />
              </Suspense>
            ) : (
              <StatsSkeleton />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

function StatCardSkeleton() {
  return (
    <div className="bg-elevated-subtle rounded px-3 py-2 flex justify-between items-center gap-3">
      <Skeleton className="h-4 w-20 bg-elevated" />
      <Skeleton className="h-4 w-14 bg-elevated" />
    </div>
  );
}

function ChartSkeleton({ height }: { height: number }) {
  return <Skeleton className="w-full bg-elevated rounded" style={{ height }} />;
}

function StatsSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-5 w-36 bg-elevated" />

      <div className="flex gap-5">
        <div className="flex flex-col gap-2 w-56 shrink-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3 w-48 bg-elevated mb-1" />
          <ChartSkeleton height={280} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <Skeleton className="h-3 w-32 bg-elevated mb-1" />
          <ChartSkeleton height={220} />
        </div>
        <div>
          <Skeleton className="h-3 w-36 bg-elevated mb-1" />
          <ChartSkeleton height={220} />
        </div>
      </div>

      <div>
        <Skeleton className="h-3 w-28 bg-elevated mb-1" />
        <ChartSkeleton height={280} />
      </div>

      <Skeleton className="h-5 w-32 bg-elevated" />

      <div className="flex gap-5">
        <div className="flex flex-col gap-2 w-56 shrink-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <Skeleton className="h-3 w-52 bg-elevated mb-1" />
          <ChartSkeleton height={220} />
        </div>
      </div>

      <Skeleton className="h-4 w-20 bg-elevated" />

      <div>
        <Skeleton className="h-3 w-28 bg-elevated mb-1" />
        <ChartSkeleton height={260} />
      </div>

      <div className="flex gap-5 justify-center">
        {Array.from({ length: 3 }).map((_, li) => (
          <div key={li} className="flex-1 min-w-0">
            <Skeleton className="h-3 w-24 bg-elevated mb-2" />
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-4" />
                  <Skeleton className="w-8 h-8 rounded bg-elevated shrink-0" />
                  <Skeleton className="h-4 flex-1 bg-elevated" />
                  <Skeleton className="h-4 w-8 bg-elevated shrink-0" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatsContent({ promise }: { promise: Promise<StatsResult> }) {
  const result = use(promise);
  if (!result.ok) {
    return (
      <div className="flex items-center justify-center h-full text-fg-faint">
        Failed to load statistics from zKillboard.
      </div>
    );
  }
  return <StatsContentInner stats={result.data} />;
}

function StatsContentInner({ stats }: { stats: ZkillSystemStats }) {
  const [shipTypeNames, setShipTypeNames] = useState<Record<number, string>>(
    {},
  );

  useEffect(() => {
    const ids = (stats.topAllTime?.find((t) => t.type === "ship")?.data ?? [])
      .slice(0, 10)
      .map((s) => s.shipTypeID)
      .filter((id): id is number => id != null);
    if (ids.length === 0) return;
    resolveNames(ids)
      .then((data) => {
        const map: Record<number, string> = {};
        for (const [id, entry] of Object.entries(data))
          map[Number(id)] = entry.name;
        setShipTypeNames(map);
      })
      .catch(() => {});
  }, [stats]);

  const sortedMonths = Object.values(stats.months ?? {})
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month))
    .slice(-36);

  const monthLabels = sortedMonths.map(
    (m) => `${MONTH_NAMES[m.month - 1]} '${String(m.year).slice(2)}`,
  );
  const monthKills = sortedMonths.map((m) => m.shipsDestroyed);
  const monthIskBillions = sortedMonths.map((m) => m.iskDestroyed / 1e9);

  const tzLabels = ["EU", "US-E", "US-W", "AU", "RU"];
  const tzKeys = ["tz:eu", "tz:use", "tz:usw", "tz:au", "tz:ru"];
  const tzValues = tzKeys.map((k) => stats.labels?.[k]?.shipsDestroyed ?? 0);

  const sizeLabels = ["Solo", "2+", "5+", "10+", "25+", "50+", "100+"];
  const sizeValues = [
    stats.labels?.["#:1"]?.shipsDestroyed ?? 0,
    stats.labels?.["#:2+"]?.shipsDestroyed ?? 0,
    stats.labels?.["#:5+"]?.shipsDestroyed ?? 0,
    stats.labels?.["#:10+"]?.shipsDestroyed ?? 0,
    stats.labels?.["#:25+"]?.shipsDestroyed ?? 0,
    stats.labels?.["#:50+"]?.shipsDestroyed ?? 0,
    stats.labels?.["#:100+"]?.shipsDestroyed ?? 0,
  ];

  const topShipData =
    stats.topAllTime?.find((t) => t.type === "ship")?.data.slice(0, 10) ?? [];
  const shipNames = topShipData.map((s) =>
    s.shipTypeID != null
      ? (shipTypeNames[s.shipTypeID] ?? `#${s.shipTypeID}`)
      : "Unknown",
  );
  const shipKills = topShipData.map((s) => s.kills);
  const hasTzData = tzValues.some((v) => v > 0);

  const activityX = Array.from(
    { length: 24 },
    (_, i) => `${String(i).padStart(2, "0")}:00`,
  );
  const activityDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const activityY = [0, 1, 2, 3, 4, 5, 6];
  const activityZ = (["0", "1", "2", "3", "4", "5", "6"] as const).map((d) => {
    const day = stats.activity?.[d];
    if (!day) return Array<number>(24).fill(0);
    if (Array.isArray(day)) return day;
    return Array.from({ length: 24 }, (_, i) => day[String(i)] ?? 0);
  });
  const activityCustomData = activityY.map(() =>
    activityX.map(
      (_, hourIdx) => `${String((hourIdx + 1) % 24).padStart(2, "0")}:00`,
    ),
  );

  const recentShips = stats.topLists?.find((t) => t.type === "shipType");
  const recentShipNames = recentShips?.values.map((v) => v.name) ?? [];
  const recentShipKills = recentShips?.values.map((v) => v.kills) ?? [];
  const recentTopLists = (stats.topLists ?? []).filter(
    (t) => t.type !== "solarSystem" && t.type !== "shipType",
  );

  return (
    <div className="space-y-5">
      <p className="font-semibold text-base">All-Time Activity</p>

      <div className="flex gap-5">
        <div className="flex flex-col gap-2 w-56 shrink-0">
          <StatCard label="Kills*" value={formatKills(stats.shipsDestroyed)} />
          <StatCard
            label="ISK Destroyed"
            value={`${formatIsk(stats.iskDestroyed)} ISK`}
          />
          <StatCard
            label="Solo Kills*"
            value={`${formatKills(stats.shipsDestroyedSolo)}`}
          />
          <StatCard
            label="Solo ISK Destroyed"
            value={`${formatIsk(stats.iskDestroyedSolo)} ISK`}
          />
          <StatCard
            label="Solo Ratio"
            value={`${(stats.soloRatio ?? 0).toFixed(1)}%`}
          />
          <StatCard
            label="Avg Gang Size"
            value={String(stats.avgGangSize ?? 0)}
          />
          <span className="text-xs text-fg-subtle italic">
            * Number may exceed rendered kills, because some kills lack position
            data.
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <ChartTitle>Monthly Activity (last 3 years)</ChartTitle>
          <Plot
            data={[
              {
                type: "bar",
                name: "Kills",
                x: monthLabels,
                y: monthKills,
                marker: { color: CHART.SERIES_KILLS },
                yaxis: "y",
              },
              {
                type: "scatter",
                mode: "lines",
                name: "ISK (Billions)",
                x: monthLabels,
                y: monthIskBillions,
                line: { color: CHART.SERIES_ISK, width: 2 },
                yaxis: "y2",
              },
            ]}
            layout={{
              ...DARK_LAYOUT,
              yaxis2: {
                overlaying: "y",
                side: "right",
                gridcolor: CHART.PAPER_BG,
                zerolinecolor: CHART.ZEROLINE,
                linecolor: CHART.AXIS_LINE,
                tickcolor: CHART.AXIS_LINE,
                tickformat: ".0f",
                title: {
                  text: "ISK (Billions)",
                  font: { color: CHART.ISK_AXIS_TITLE, size: 11 },
                },
              },
              margin: { ...DARK_LAYOUT.margin, r: 60 },
              legend: { ...DARK_LAYOUT.legend, orientation: "h", y: -0.2 },
              bargap: 0.15,
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: "100%" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <ChartTitle>Timezone Activity</ChartTitle>
          {hasTzData ? (
            <Plot
              data={[
                {
                  type: "bar",
                  x: tzLabels,
                  y: tzValues,
                  marker: { color: CHART.SERIES_TZ },
                },
              ]}
              layout={{
                ...DARK_LAYOUT,
                margin: { l: 55, r: 30, t: 10, b: 40 },
                xaxis: { ...DARK_LAYOUT.xaxis, tickformat: ",.0f" },
              }}
              config={PLOT_CONFIG}
              useResizeHandler
              style={{ width: "100%", height: 220 }}
            />
          ) : (
            <NoData height={220} />
          )}
        </div>
        <div>
          <ChartTitle>Fleet Size Distribution</ChartTitle>
          <Plot
            data={[
              {
                type: "bar",
                x: sizeLabels,
                y: sizeValues,
                marker: { color: CHART.SERIES_SIZE },
              },
            ]}
            layout={{
              ...DARK_LAYOUT,
              margin: { l: 55, r: 30, t: 10, b: 40 },
              yaxis: { ...DARK_LAYOUT.yaxis, tickformat: ",.0f" },
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: 220 }}
          />
        </div>
      </div>

      <div>
        <ChartTitle>Top Ship Types</ChartTitle>
        {shipKills.length > 0 ? (
          <Plot
            data={[
              {
                type: "bar",
                x: shipNames,
                y: shipKills,
                marker: { color: CHART.SERIES_SHIPS },
              },
            ]}
            layout={{
              ...DARK_LAYOUT,
              margin: { l: 55, r: 30, t: 10, b: 40 },
              xaxis: { ...DARK_LAYOUT.xaxis, tickformat: ",.0f" },
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: 280 }}
          />
        ) : (
          <NoData height={280} />
        )}
      </div>

      <p className="font-semibold text-base">Recent Activity</p>

      <div className="flex gap-5">
        <div className="flex flex-col gap-2 w-56 shrink-0">
          <StatCard
            label="Characters"
            value={(stats.activepvp.characters?.count ?? 0).toLocaleString()}
          />
          <StatCard
            label="Corporations"
            value={(stats.activepvp.corporations?.count ?? 0).toLocaleString()}
          />
          <StatCard
            label="Alliances"
            value={(stats.activepvp.alliances?.count ?? 0).toLocaleString()}
          />
          <StatCard
            label="Ships"
            value={(stats.activepvp.ships?.count ?? 0).toLocaleString()}
          />
          <StatCard
            label="Kills*"
            value={(stats.activepvp.kills?.count ?? 0).toLocaleString()}
          />
          <span className="text-xs text-fg-subtle italic">
            * Number may exceed rendered kills, because some kills lack position
            data.
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <ChartTitle>Hourly Activity (90-day average)</ChartTitle>
          <Plot
            data={[
              {
                type: "heatmap",
                x: activityX,
                y: activityY,
                z: activityZ,
                colorscale: "Viridis",
                showscale: true,
                customdata: activityCustomData,
                hovertemplate:
                  "%{y} %{x}–%{customdata}: ~%{z} avg kills<extra></extra>",
              },
            ]}
            layout={{
              ...DARK_LAYOUT,
              margin: { l: 40, r: 60, t: 10, b: 40 },
              yaxis: {
                ...DARK_LAYOUT.yaxis,
                tickmode: "array",
                tickvals: activityY,
                ticktext: activityDays,
                dtick: 1,
                range: [-0.5, 6.5],
              },
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: 220 }}
          />
        </div>
      </div>

      <p className="font-normal text-sm">Last 7 Days</p>

      {recentShipKills.length > 0 && (
        <div>
          <ChartTitle>Top Ship Types</ChartTitle>
          <Plot
            data={[
              {
                type: "bar",
                x: recentShipNames,
                y: recentShipKills,
                marker: { color: CHART.SERIES_SHIPS },
              },
            ]}
            layout={{
              ...DARK_LAYOUT,
              margin: { l: 55, r: 30, t: 10, b: 80 },
              yaxis: { ...DARK_LAYOUT.yaxis, tickformat: ",.0f" },
            }}
            config={PLOT_CONFIG}
            useResizeHandler
            style={{ width: "100%", height: 260 }}
          />
        </div>
      )}

      {recentTopLists.length > 0 && (
        <div className="flex gap-5 justify-center">
          {recentTopLists.map((list) => (
            <TopList key={list.type} list={list} />
          ))}
        </div>
      )}
    </div>
  );
}

function NoData({ height }: { height: number }) {
  return (
    <div
      className="flex items-center justify-center text-fg-subtle text-sm"
      style={{ height }}
    >
      No data available
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-panel-elevated border-l-2 border-capsuleer/60 px-3 py-2 flex justify-between items-center gap-3">
      <span className="text-fg-muted text-sm">{label}</span>
      <span className="text-foreground text-sm font-medium text-right font-mono">
        {value}
      </span>
    </div>
  );
}

function ChartTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-fg-muted text-xs mb-1 px-1">{children}</div>;
}

function entityImageUrl(type: string, id: number): string | null {
  if (type === "character") return characterPortraitUrl(id);
  if (type === "corporation") return corporationLogoUrl(id);
  if (type === "alliance") return allianceLogoUrl(id);
  return null;
}

function zkillUrl(type: string, id: number): string {
  if (type === "character") return characterZkillUrl(id);
  if (type === "corporation") return corporationZkillUrl(id);
  if (type === "alliance") return allianceZkillUrl(id);
  return locationZkillUrl(id);
}

function TopList({ list }: { list: ZkillSystemStats["topLists"][0] }) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-fg-muted text-xs mb-2 px-1">{list.title}</p>
      <div className="space-y-1">
        {list.values.map((item, i) => {
          const imgUrl = entityImageUrl(list.type, item.id);
          const href = zkillUrl(list.type, item.id);
          return (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-fg-subtle text-xs w-4 text-right shrink-0">
                {i + 1}
              </span>
              {imgUrl && (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  <img
                    src={imgUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded shrink-0"
                  />
                </a>
              )}
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-strong hover:text-foreground text-sm truncate flex-1"
              >
                {item.name}
              </a>
              <span className="text-fg-faint text-xs shrink-0">
                {item.kills.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
