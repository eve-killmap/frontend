import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { API_BASE } from "@/lib/net/endpoints";
import { SystemsData } from "@/lib/schema/map-schema";
import {
  RankSystem,
  TopSystemsResponse,
  RankSystemsResponse,
} from "@/lib/schema/map-schema";
import { RankSystemsResponseSchema } from "@/lib/schema/map-schema.zod";
import { slugify } from "@/lib/formatting/slugify";
import { formatAbsoluteUTC } from "@/lib/formatting/time";
import { AppLink } from "@/components/common/app-link";
import React, { useEffect, useMemo, useState } from "react";
import { Panel, PanelHeader, PanelTitle } from "@/components/common/panel";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { useHighlightedSystemStore } from "@/stores/map/highlighted-system-store";

const NUMBER_OF_RANKS = 10;

const TOP_TABS = [
  { key: "all", label: "All" },
  { key: "day", label: "Day" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "six_months", label: "6 Mo" },
  { key: "year", label: "Year" },
] as const;

type TopTabKey = (typeof TOP_TABS)[number]["key"];

interface RankSystemsProps {
  systemsData: SystemsData;
  open: boolean;
  onToggle: () => void;
}

export const RankSystems = React.memo(function RankSystems({
  systemsData,
  open,
  onToggle,
}: RankSystemsProps) {
  const [data, setData] = useState<RankSystemsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const idToName = useMemo(() => {
    const map = new Map<number, string>();
    for (let i = 0; i < systemsData.systemIDs.length; i++) {
      map.set(systemsData.systemIDs[i], systemsData.systems[i]);
    }
    return map;
  }, [systemsData]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      try {
        const data = await apiFetch(
          `${API_BASE}/stats/system-rankings`,
          RankSystemsResponseSchema,
          { signal: controller.signal },
        );
        setData(data);
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError")
          setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, []);

  const ref = useDismissablePanel(open, onToggle);

  if (error) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        className={`btn-glass ${open ? "text-capsuleer border-capsuleer/60" : ""}`}
        aria-expanded={open}
        title="Top systems"
      >
        <TrendingUp />
        <span className="btn-label">Top</span>
      </Button>
      {open && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-65 max-w-[calc(100vw-2rem)]">
          <Panel>
            <PanelHeader>
              <PanelTitle>Top 10 Systems</PanelTitle>
            </PanelHeader>
            <div className="p-1">
              <TopSystems
                idToName={idToName}
                data={data ? data.top : null}
                loading={loading}
              />
            </div>
            {data?.computed_at != null && (
              <p className="text-2xs text-fg-subtle px-2 py-1 border-t border-border/40">
                Data current as of {formatAbsoluteUTC(data.computed_at)} UTC.
              </p>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
});

interface TopSystemsProps {
  idToName: Map<number, string>;
  data: TopSystemsResponse | null;
  loading: boolean;
}

function TopSystems({ idToName, data, loading }: TopSystemsProps) {
  const [activeTab, setActiveTab] = useState<TopTabKey>("all");

  const activeList: RankSystem[] | null = data ? data[activeTab] : null;

  return (
    <>
      <div className="flex gap-0.5 mb-1">
        {TOP_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 text-2xs py-0.5 transition-colors ${
              activeTab === tab.key
                ? "bg-capsuleer/20 text-capsuleer"
                : "text-fg-faint hover:text-fg-secondary hover:bg-panel-elevated"
            } cursor-pointer`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {loading ? (
        <RankSystemsListSkeleton />
      ) : activeList && activeList.length === 0 ? (
        <p className="text-2xs text-fg-subtle italic px-1 py-1">
          No data for this window.
        </p>
      ) : (
        <RankSystemsListItems systems={activeList ?? []} idToName={idToName} />
      )}
    </>
  );
}

function RankSystemsListSkeleton() {
  const widths = useMemo(
    () =>
      Array.from({ length: NUMBER_OF_RANKS }, () => 15 + Math.random() * 35),
    [],
  );

  return (
    <ol>
      {Array.from({ length: NUMBER_OF_RANKS }).map((_, i) => (
        <li key={i} className="flex items-center gap-2 px-1 py-0.5">
          <span className="text-xs text-fg-subtle w-4 shrink-0 text-right tabular-nums">
            {i + 1}
          </span>
          <Skeleton
            style={{ width: `${widths[i]}%` }}
            className="h-4 bg-panel-elevated"
          />
          <Skeleton className="w-10 h-4 ml-auto bg-panel-elevated" />
        </li>
      ))}
    </ol>
  );
}

function RankSystemsListItems({
  systems,
  idToName,
}: {
  systems: RankSystem[];
  idToName: Map<number, string>;
}) {
  const setHighlight = useHighlightedSystemStore((s) => s.setHighlightedSystem);
  useEffect(() => () => setHighlight(null), [setHighlight]);
  return (
    <ol>
      {systems.map((system, i) => {
        const name =
          idToName.get(system.solar_system_id) ?? `#${system.solar_system_id}`;
        return (
          <li key={system.solar_system_id}>
            <AppLink
              to={`/${slugify(name)}`}
              className="w-full flex items-center gap-2 px-1 py-0.5 hover:bg-panel-elevated text-left transition-colors group cursor-pointer"
              onMouseEnter={() => setHighlight(system.solar_system_id)}
              onMouseLeave={() => setHighlight(null)}
            >
              <span className="text-xs text-fg-subtle w-4 shrink-0 text-right tabular-nums">
                {i + 1}
              </span>
              <span className="text-xs text-fg-secondary group-hover:text-foreground flex-1 truncate transition-colors">
                {name}
              </span>
              <span className="text-xs text-fg-faint shrink-0 tabular-nums">
                {`${system.kill_count.toLocaleString()} kills`}
              </span>
            </AppLink>
          </li>
        );
      })}
    </ol>
  );
}
