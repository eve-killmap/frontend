import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppLink } from "@/components/common/app-link";
import { originatingMapPath } from "@/lib/map/originating-map";
import { SystemData, TypeData } from "@/lib/schema/system-schema";
import { LoadingKills } from "./loading-kills";
import { DebugStats } from "./debug-stats";
import { useKillStore } from "@/stores/kill-store";
import {
  EXCLUDED_TYPE_IDS,
  systemSettingsActions,
  getSystemSettingsState,
  useSystemSettingsStore,
} from "@/stores/system/system-settings-store";
import { SystemSettings } from "./settings/system-settings";
import { SystemStats } from "./stats/system-stats";
import { SystemNameHeader } from "./header/system-name-header";
import { NeighborMap } from "./header/neighbor-map";
import { TriglavianFontToggle } from "@/components/map/ui/triglavian-font-toggle";
import { isTriglavianSystem } from "@/lib/map/triglavian";
import { KillHoverCard } from "./kill-hover-card";
import { OffScreenIndicator } from "./off-screen-indicator";
import { SystemPlayback } from "./playback/system-playback";
import { PlaybackControls } from "./playback/playback-controls";
import { ArrowLeft, Command as CommandIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeRangeBar } from "./time-range-bar";
import { InfoButton } from "@/components/info/info-button";
import { SystemKillFeed } from "./system-kill-feed";
import { SystemKillList } from "./system-kill-list";
import { BuildInfo } from "@/lib/schema/base-schema";
import { CameraControls } from "./camera/camera-controls";
import { IntactStargateData } from "@/lib/schema/system-schema";
import { SharePanel } from "./share/share-panel";
import { useSharedViewStore } from "@/stores/system/shared-view-store";
import { SystemFilter } from "./filter/system-filter";
import { useFilterUrl } from "@/hooks/use-filter-url";
import { useSystemFilterMask } from "@/hooks/system/use-system-filter-mask";
import { useSystemJumpCount } from "@/hooks/system/use-system-jump-count";
import { useRegisterCommands } from "@/hooks/use-register-commands";
import {
  buildSystemCommands,
  type SystemPanel,
} from "@/lib/commands/build-system-commands";
import { currentShortcutLabel } from "@/lib/commands/platform";
import { setOpenInfoFn } from "@/lib/info-functions";
import {
  resetCameraFn,
  horizCameraFn,
  vertCameraFn,
} from "@/lib/camera-functions";
import { navigateTo } from "@/lib/navigation-functions";
import {
  exportSystemPngFn,
  exportSystemCsvFn,
} from "@/lib/export/export-functions";
import { useCommandPaletteStore } from "@/stores/command-palette-store";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { useCollapseLabels } from "@/hooks/use-collapse-labels";

const NO_STARGATES: IntactStargateData[] = [];

function SystemKillFeedGated({
  systemData,
  typeData,
  minimized,
  onToggleMinimize,
  className,
}: {
  systemData: SystemData;
  typeData: TypeData;
  minimized: boolean;
  onToggleMinimize: () => void;
  className: string;
}) {
  const enableKillFeed = useSystemSettingsStore((s) => s.enableKillFeed);
  if (!enableKillFeed) return null;
  return (
    <SystemKillFeed
      systemData={systemData}
      typeData={typeData}
      minimized={minimized}
      onToggleMinimize={onToggleMinimize}
      className={className}
    />
  );
}

interface SolarSystemUIProps {
  sdeInfo: BuildInfo;
  systemData: SystemData;
  typeData: TypeData;
}

type OpenPanel =
  | "camera"
  | "playback"
  | "settings"
  | "stats"
  | "info"
  | "share"
  | "filter"
  | null;

export function SolarSystemUI({
  sdeInfo,
  systemData,
  typeData,
}: SolarSystemUIProps) {
  const data = useKillStore((s) => s.data);
  const resetNonce = useSharedViewStore((s) => s.resetNonce);
  const initializedRef = useRef(false);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [feedMinimized, setFeedMinimized] = useState(false);
  const [listMinimized, setListMinimized] = useState(false);
  const [timelineExpanded, setTimelineExpanded] = useState(true);
  const [controlsInset, setControlsInset] = useState<number | null>(null);
  const bottomInset = controlsInset ?? 16;

  const togglePanel = useCallback((panel: OpenPanel) => {
    setOpenPanel((prev) => (prev === panel ? null : panel));
  }, []);

  useFilterUrl();

  useLayoutEffect(() => {
    setOpenInfoFn(() => setOpenPanel("info"));
    return () => setOpenInfoFn(null);
  }, []);

  const togglePalette = useCommandPaletteStore((s) => s.toggle);

  const systemCommands = useMemo(() => {
    const settings = getSystemSettingsState;
    const actions = systemSettingsActions;
    const playback = () => usePlaybackStore.getState();
    const global = () => useGlobalSettingsStore.getState();
    return buildSystemCommands({
      backPath: originatingMapPath() ?? "/",
      navigate: (path) => navigateTo?.(path),
      resetCamera: () => resetCameraFn?.(),
      sideView: () => horizCameraFn?.(),
      verticalView: () => vertCameraFn?.(),
      isActive: () => playback().isActive,
      isPlaying: () => playback().isPlaying,
      dataLoaded: () => useKillStore.getState().data !== null,
      startPlayback: () => playback().startPlayback(),
      setPlaying: (v) => playback().setPlaying(v),
      enableKillFeed: () => settings().enableKillFeed,
      setEnableKillFeed: actions.setEnableKillFeed,
      showKillFlash: () => settings().showKillFlash,
      setShowKillFlash: actions.setShowKillFlash,
      showDebugStats: () => global().showDebugStats,
      setShowDebugStats: (v) => global().setShowDebugStats(v),
      starShown: () => settings().starMeshShown,
      setStarShown: actions.setStarMeshShown,
      planetsShown: () => settings().planetMeshesShown,
      setPlanetsShown: actions.setPlanetMeshesShown,
      moonsShown: () => settings().moonMeshesShown,
      setMoonsShown: actions.setMoonMeshesShown,
      beltsShown: () => settings().beltMeshesShown,
      setBeltsShown: actions.setBeltMeshesShown,
      openPanel: (panel: SystemPanel) => setOpenPanel(panel),
      exportPng: () => void exportSystemPngFn?.(),
      exportCsv: () => void exportSystemCsvFn?.(),
    });
  }, []);
  useRegisterCommands("system", systemCommands);

  useSystemFilterMask(systemData.solarSystemID);
  const jumps = useSystemJumpCount(systemData.solarSystemID);

  const toggleCamera = useCallback(() => togglePanel("camera"), [togglePanel]);
  const togglePlayback = useCallback(
    () => togglePanel("playback"),
    [togglePanel],
  );
  const toggleSettings = useCallback(
    () => togglePanel("settings"),
    [togglePanel],
  );
  const toggleStats = useCallback(() => togglePanel("stats"), [togglePanel]);
  const toggleInfo = useCallback(() => togglePanel("info"), [togglePanel]);
  const toggleFilter = useCallback(() => togglePanel("filter"), [togglePanel]);

  const [sharePreset, setSharePreset] = useState(false);
  const toggleShare = useCallback(() => {
    togglePanel("share");
    setSharePreset(false);
  }, [togglePanel]);
  const shareMoment = useCallback(() => {
    setOpenPanel("share");
    setSharePreset(true);
  }, []);

  const topBar = useCollapseLabels<HTMLDivElement>();

  useEffect(() => {
    const typeGroupMap: Record<number, number> = {};
    for (const [gidStr, typeIds] of Object.entries(typeData.typeTree)) {
      const gid = Number(gidStr);
      for (const id of typeIds) typeGroupMap[id] = gid;
    }
    systemSettingsActions.setTypeGroupMap(typeGroupMap);
  }, [typeData, resetNonce]);

  useEffect(() => {
    const allTypeIds = new Set<number>();
    for (const typeIds of Object.values(typeData.typeTree))
      for (const id of typeIds) allTypeIds.add(id);

    if (data && data.count > 0) {
      const s = getSystemSettingsState();
      const presentTypes = new Set(data.ship_types);
      const initial = new Set(
        [...presentTypes].filter(
          (id) =>
            !EXCLUDED_TYPE_IDS.includes(id) &&
            !s.deselectedTypeIds.includes(id),
        ),
      );
      for (const id of s.showExcludedTypeIds)
        if (presentTypes.has(id)) initial.add(id);
      systemSettingsActions.setShipTypes(initial);
      initializedRef.current = true;
      return;
    }
    if (!initializedRef.current) {
      systemSettingsActions.setShipTypes(
        new Set(
          [...allTypeIds].filter((id) => !EXCLUDED_TYPE_IDS.includes(id)),
        ),
      );
    }
  }, [typeData, data, resetNonce]);

  return (
    <div className="absolute inset-0 pointer-events-none">
      <LoadingKills />
      <div
        className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-auto w-75"
        style={{ bottom: bottomInset }}
      >
        <div className="flex gap-2 shrink-0">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="btn-glass flex-1"
          >
            <AppLink to={originatingMapPath() ?? "/"}>
              <ArrowLeft />
              Back to Map
            </AppLink>
          </Button>
          <Button
            variant="outline"
            size="icon-lg"
            onClick={togglePalette}
            aria-label={`Open command palette (${currentShortcutLabel()})`}
            title={currentShortcutLabel()}
            className="btn-glass shrink-0"
          >
            <CommandIcon />
          </Button>
        </div>
        <div className="flex-1 min-h-0 flex flex-col gap-2">
          <SystemKillFeedGated
            systemData={systemData}
            typeData={typeData}
            minimized={feedMinimized}
            onToggleMinimize={() => setFeedMinimized((v) => !v)}
            className={feedMinimized ? "shrink-0" : "min-h-0 max-h-1/2"}
          />
          <SystemKillList
            systemData={systemData}
            typeData={typeData}
            minimized={listMinimized}
            onToggleMinimize={() => setListMinimized((v) => !v)}
            className={listMinimized ? "shrink-0" : "min-h-0 max-h-1/2"}
          />
        </div>
      </div>
      <div className="absolute top-4 left-85">
        <DebugStats jumps={jumps} />
      </div>
      <div
        ref={topBar.ref}
        data-collapsed={topBar.collapsed ? "true" : undefined}
        className="absolute top-4 inset-x-4 grid grid-cols-[minmax(18.75rem,1fr)_auto_1fr] items-start gap-2"
      >
        <div data-measure className="w-75" aria-hidden="true" />
        <div data-measure className="flex flex-col items-center gap-1">
          <SystemNameHeader
            sdeInfo={sdeInfo}
            systemData={systemData}
            jumps={jumps}
          />
          <NeighborMap
            intactStargates={systemData.stargates ?? NO_STARGATES}
            jumps={jumps}
          />
        </div>
        <div data-measure className="justify-self-end flex gap-2">
          {isTriglavianSystem(systemData.solarSystemID) && (
            <div className="flex pointer-events-auto">
              <TriglavianFontToggle />
            </div>
          )}
          <SystemFilter
            open={openPanel === "filter"}
            onToggle={toggleFilter}
            systemData={systemData}
            typeData={typeData}
          />
          <CameraControls
            open={openPanel === "camera"}
            onToggle={toggleCamera}
          />
          <SystemPlayback
            open={openPanel === "playback"}
            onToggle={togglePlayback}
          />
          <SystemSettings
            typeData={typeData}
            open={openPanel === "settings"}
            onToggle={toggleSettings}
          />
          <SystemStats
            systemData={systemData}
            open={openPanel === "stats"}
            onToggle={toggleStats}
          />
          <SharePanel
            open={openPanel === "share"}
            onToggle={toggleShare}
            presetPlayback={sharePreset}
            systemData={systemData}
            typeData={typeData}
          />
          <InfoButton open={openPanel === "info"} onToggle={toggleInfo} />
        </div>
      </div>
      <div className="absolute bottom-4 left-0 right-0">
        <PlaybackControls onShare={shareMoment} />
      </div>
      <div className="absolute bottom-0 left-0 right-0">
        <TimeRangeBar
          expanded={timelineExpanded}
          onExpandedChange={setTimelineExpanded}
          onControlsInsetChange={setControlsInset}
        />
      </div>
      <KillHoverCard typeData={typeData} systemData={systemData} />
      <OffScreenIndicator />
    </div>
  );
}
