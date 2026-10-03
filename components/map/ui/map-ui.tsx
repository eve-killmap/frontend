import { SystemSearch } from "@/components/map/ui/system-search";
import { MapSettings } from "./map-settings";
import { ResetCamera } from "@/components/map/ui/reset-camera";
import { MapLinks } from "./map-links";
import { SystemsData } from "@/lib/schema/map-schema";
import { RankSystems } from "./rank-systems";
import { LeaderboardsButton } from "./leaderboards/leaderboards-button";
import { InfoButton } from "@/components/info/info-button";
import { KillFeed } from "./kill-feed";
import { ServerStatus } from "./server-status";
import { MapDimensionToggle } from "./map-dimension-toggle";
import { TriglavianFontToggle } from "./triglavian-font-toggle";
import { MapColorLegend } from "./map-color-legend";
import { MapTimeRangeBar } from "./map-time-range-bar";
import { MapDebugStats } from "./map-debug-stats";
import { MapFilterPanel } from "./filter/map-filter-panel";
import { MapSharePanel } from "./share/map-share-panel";
import { useMapKillFeed } from "@/hooks/map/use-map-kill-feed";
import { useUniverseStatus } from "@/hooks/map/use-universe-status";
import { useFilterUrl } from "@/hooks/use-filter-url";
import { usePruneEmptyConditionsOnClose } from "@/hooks/use-prune-empty-conditions-on-close";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useMapStore } from "@/stores/map/map-store";
import { colorModeAllowedOn, overlayAllowedOn } from "@/lib/map/system-colors";
import { useFilterStore } from "@/stores/filter-store";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { useRegisterCommands } from "@/hooks/use-register-commands";
import {
  buildMapCommands,
  type MapPanel,
} from "@/lib/commands/build-map-commands";
import { setOpenInfoFn } from "@/lib/info-functions";
import { resetCameraFn } from "@/lib/camera-functions";
import { exportMapPngFn } from "@/lib/export/export-functions";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { useCollapseLabels } from "@/hooks/use-collapse-labels";

function KillFeedConnected({ systemsData }: { systemsData: SystemsData }) {
  useMapKillFeed();
  return <KillFeed systemsData={systemsData} />;
}

function ServerStatusConnected() {
  useUniverseStatus();
  return <ServerStatus />;
}

interface MapUIProps {
  systemsData: SystemsData;
  mapType: string;
}

type TopRightPanel = "filter" | "share" | "settings" | "info";
type CenterPanel = "search" | "top" | "leaderboards";

export function MapUI({ systemsData, mapType }: MapUIProps) {
  const [openPanel, setOpenPanel] = useState<TopRightPanel | null>(null);
  const [centerPanel, setCenterPanel] = useState<CenterPanel | null>(null);
  const enableKillFeed = useMapStore((s) => s.enableKillFeed);
  const conditionCount = useFilterStore((s) => s.conditions.length);
  const colorMode = useMapStore((s) => s.colorMode);
  const setColorMode = useMapStore((s) => s.setColorMode);
  useEffect(() => {
    if (!colorModeAllowedOn(colorMode, mapType)) setColorMode("activity");
  }, [colorMode, mapType, setColorMode]);
  const overlay = useMapStore((s) => s.overlay);
  const setOverlay = useMapStore((s) => s.setOverlay);
  useEffect(() => {
    if (!overlayAllowedOn(overlay, mapType)) setOverlay("none");
  }, [overlay, mapType, setOverlay]);
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [controlsInset, setControlsInset] = useState<number | null>(null);
  const bottomInset = controlsInset ?? 16;

  useFilterUrl();

  useLayoutEffect(() => {
    setOpenInfoFn(() => setOpenPanel("info"));
    return () => setOpenInfoFn(null);
  }, []);

  const mapCommands = useMemo(() => {
    const map = () => useMapStore.getState();
    const global = () => useGlobalSettingsStore.getState();
    const openPanel = (panel: MapPanel) => {
      if (panel === "top" || panel === "leaderboards") setCenterPanel(panel);
      else setOpenPanel(panel);
    };
    return buildMapCommands({
      mapType,
      colorMode: () => map().colorMode,
      setColorMode: (m) => map().setColorMode(m),
      overlay: () => map().overlay,
      setOverlay: (m) => map().setOverlay(m),
      show3D: () => map().show3D,
      setShow3D: (v) => map().setShow3D(v),
      resetCamera: () => resetCameraFn?.(),
      enableKillFeed: () => map().enableKillFeed,
      setEnableKillFeed: (v) => map().setEnableKillFeed(v),
      showKillFlash: () => map().showKillFlash,
      setShowKillFlash: (v) => map().setShowKillFlash(v),
      showDebugStats: () => global().showDebugStats,
      setShowDebugStats: (v) => global().setShowDebugStats(v),
      openPanel,
      exportPng: () => void exportMapPngFn?.(),
    });
  }, [mapType]);
  useRegisterCommands("map", mapCommands);

  const toggleTopRight = (p: TopRightPanel) =>
    setOpenPanel((cur) => (cur === p ? null : p));

  const filterOpen = openPanel === "filter";
  usePruneEmptyConditionsOnClose(filterOpen);
  const filterRef = useDismissablePanel(filterOpen, () =>
    toggleTopRight("filter"),
  );
  const topBar = useCollapseLabels<HTMLDivElement>();

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        ref={topBar.ref}
        data-collapsed={topBar.collapsed ? "true" : undefined}
        className="absolute top-4 inset-x-4 grid grid-cols-[1fr_auto_1fr] items-start gap-2"
      >
        <div className="flex items-start gap-2">
          <div
            data-measure
            className="flex flex-col gap-2 pointer-events-auto w-75 shrink-0"
            style={{ maxHeight: `calc(100vh - ${16 + bottomInset}px)` }}
          >
            <MapLinks mapType={mapType} />
            {enableKillFeed && <KillFeedConnected systemsData={systemsData} />}
          </div>
          <div
            data-measure
            className="flex flex-col items-start gap-2 shrink-0"
          >
            {mapType === "new-eden" && (
              <div className="flex h-10 pointer-events-auto whitespace-nowrap">
                <MapDimensionToggle />
              </div>
            )}
            {mapType === "abyssal-deadspace" && (
              <div className="flex h-10 pointer-events-auto">
                <TriglavianFontToggle />
              </div>
            )}
            <MapDebugStats mapType={mapType} />
          </div>
        </div>
        <div
          data-measure
          className="z-hud flex items-start gap-2 pointer-events-auto"
        >
          <div className="h-10 mr-1 flex items-center pointer-events-none">
            <ServerStatusConnected />
          </div>
          <SystemSearch
            systems={systemsData.systems}
            systemIDs={systemsData.systemIDs}
            open={centerPanel === "search"}
            onOpenChange={(o) =>
              setCenterPanel((cur) =>
                o ? "search" : cur === "search" ? null : cur,
              )
            }
          />
          <RankSystems
            systemsData={systemsData}
            open={centerPanel === "top"}
            onToggle={() =>
              setCenterPanel((cur) => (cur === "top" ? null : "top"))
            }
          />
          <LeaderboardsButton
            open={centerPanel === "leaderboards"}
            onToggle={() =>
              setCenterPanel((cur) =>
                cur === "leaderboards" ? null : "leaderboards",
              )
            }
          />
        </div>
        <div data-measure className="justify-self-end pointer-events-auto">
          <div className="flex gap-2 whitespace-nowrap">
            <div ref={filterRef} className="relative">
              <Button
                variant="outline"
                size="lg"
                onClick={() => toggleTopRight("filter")}
                className={`btn-glass ${filterOpen ? "text-capsuleer border-capsuleer/60" : ""}`}
                aria-label="Filter kills"
                title="Filter"
                aria-expanded={filterOpen}
              >
                <Filter />
                <span className="btn-label">Filter</span>
                {conditionCount > 0 && (
                  <span className="ml-0.5 rounded bg-capsuleer/25 px-1.5 text-2xs tabular-nums">
                    {conditionCount}
                  </span>
                )}
              </Button>
              {filterOpen && (
                <div className="absolute top-full right-0 mt-2 w-84 max-w-[calc(100vw-2rem)]">
                  <MapFilterPanel />
                </div>
              )}
            </div>
            <MapSharePanel
              open={openPanel === "share"}
              onToggle={() => toggleTopRight("share")}
              mapType={mapType}
            />
            <ResetCamera />
            <MapSettings
              open={openPanel === "settings"}
              onToggle={() => toggleTopRight("settings")}
              mapType={mapType}
            />
            <InfoButton
              open={openPanel === "info"}
              onToggle={() => toggleTopRight("info")}
            />
          </div>
        </div>
      </div>
      <div className="absolute left-85" style={{ bottom: bottomInset }}>
        <MapColorLegend />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <MapTimeRangeBar
          mapType={mapType}
          expanded={timelineExpanded}
          onExpandedChange={setTimelineExpanded}
          onControlsInsetChange={setControlsInset}
        />
      </div>
    </div>
  );
}
