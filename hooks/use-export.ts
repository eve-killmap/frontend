import { useCallback, useEffect, useRef, useState } from "react";
import { useMapStore } from "@/stores/map/map-store";
import { useTimeRangeStore } from "@/stores/time-range-store";
import { useActivityData } from "@/hooks/map/use-activity-data";
import { useJumpsData } from "@/hooks/map/use-jumps-data";
import {
  useLiveKillStore,
  hotCounts,
  type LiveKillEntry,
} from "@/stores/live-kill-store";
import { useMapSystemsStore } from "@/stores/map/map-systems-store";
import { useSovStore } from "@/stores/map/sov-store";
import { usePlaybackStore } from "@/stores/system/playback-store";
import { useKillStore } from "@/stores/kill-store";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { useGlobalSettingsStore } from "@/stores/global-settings-store";
import { formatActivityRangeLabel } from "@/lib/map/system-kills-query";
import { legendSpecFor } from "@/lib/export/legend-spec";
import { exportPng } from "@/lib/export/export-png";
import { buildKillCsv } from "@/lib/export/build-kill-csv";
import { downloadBlob } from "@/lib/export/download";
import type { FilteredKills } from "@/lib/kill/kill-filter";
import {
  mapPngFilename,
  systemPngFilename,
  killCsvFilename,
} from "@/lib/export/export-filename";
import { exportTimeMs, timeLabelFor } from "@/lib/export/export-time";
import { systemHeaderSpec, type ExportFocus } from "@/lib/export/system-header";
import { EXPORT_FONTS } from "@/lib/export/export-theme";
import { resolveFocusObject } from "@/lib/export/focus-object";
import { loadImage } from "@/lib/export/load-image";
import { formatDistance } from "@/lib/formatting/format-distance";
import { getIconURL } from "@/lib/eve/icon-url";
import { cameraMetrics } from "@/stores/system/camera-metrics-store";
import { useFloatingOriginStore } from "@/stores/system/floating-origin-store";
import { getAllIcons } from "@/stores/system/icon-store";
import {
  exportMapPngFn,
  exportSystemPngFn,
  exportSystemCsvFn,
  setExportMapPngFn,
  setExportSystemPngFn,
  setExportSystemCsvFn,
} from "@/lib/export/export-functions";
import { playbackTimeState } from "@/lib/system/playback-time-state";
import { loadShipTypeNames } from "@/lib/eve/ship-types";
import { findNearestObject } from "@/lib/system/find-nearest-object";
import { isTriglavianSystem } from "@/lib/map/triglavian";
import { HOT_MAX_FLOOR } from "@/components/map/hot/hot-sources";
import type { SystemData, TypeRadiiData } from "@/lib/schema/system-schema";

export const EXPORT_SCALE = 2;
const ERROR_MS = 4000;
const EMPTY_IDS: ReadonlySet<number> = new Set();
const EMPTY_ENTRIES: LiveKillEntry[] = [];
const TRIGLAVIAN_FONT = EXPORT_FONTS.triglavian;

const EMPTY_FILTERED_KILLS: FilteredKills = {
  x: [],
  y: [],
  z: [],
  killmailIds: [],
  shipTypes: [],
  killmailTimes: [],
  count: 0,
  earliestTime: null,
  latestTime: null,
};

export function resolveCsvRows(
  filteredKills: FilteredKills | null,
  dataLoaded: boolean,
): FilteredKills {
  if (filteredKills) return filteredKills;
  if (!dataLoaded) throw new Error("Kills not loaded yet");
  return EMPTY_FILTERED_KILLS;
}

async function exportFocus(
  systemData: SystemData,
  typeRadii: TypeRadiiData,
): Promise<ExportFocus | undefined> {
  const [ox, oy, oz] = useFloatingOriginStore.getState().origin;
  const t = cameraMetrics.controlsTarget;
  const focus = resolveFocusObject(
    [t.x + ox, t.y + oy, t.z + oz],
    getAllIcons(),
    systemData,
    typeRadii,
  );
  if (!focus) return undefined;
  const icon =
    focus.iconID === null
      ? null
      : await loadImage(`/${getIconURL(focus.iconID)}`);
  return {
    kind: focus.kind,
    name: focus.name,
    distanceLabel:
      focus.distance === undefined ? undefined : formatDistance(focus.distance),
    icon: icon ?? undefined,
  };
}

function useAsyncExport() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef = useRef(false);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const run = useCallback(async (fn: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setError(null), ERROR_MS);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);
  return { busy, error, run };
}

export function useMapExport(mapType: string) {
  const { busy, error, run } = useAsyncExport();
  const colorMode = useMapStore((s) => s.colorMode);
  const overlay = useMapStore((s) => s.overlay);
  const range = useTimeRangeStore((s) => s.range);
  const {
    lookup: activityLookup,
    filterActive,
    error: activityError,
  } = useActivityData(colorMode === "activity");
  const effectiveMode = filterActive ? "activity" : colorMode;
  const { lookup: jumpsLookup, error: jumpsError } = useJumpsData(
    effectiveMode === "jumps",
  );
  const entries = useLiveKillStore((s) =>
    overlay === "hot" ? s.entries : EMPTY_ENTRIES,
  );
  const mapSystemIDs = useMapSystemsStore((s) => s.systemIDs);
  const sovData = useSovStore((s) => s.data);
  const activityRangeLabel = formatActivityRangeLabel(range);
  const admAvailable = sovData ? sovData.admAvailable : null;

  const exportPngNow = useCallback(
    () =>
      run(() => {
        const hotMax =
          overlay === "hot"
            ? hotCounts(entries, Date.now(), mapSystemIDs ?? EMPTY_IDS).max
            : 0;
        const legend = legendSpecFor({
          effectiveMode,
          overlay,
          activityMax: activityLookup?.max ?? null,
          activityError,
          activityRangeLabel,
          filterActive,
          jumpsMax: jumpsLookup?.max ?? null,
          jumpsError,
          hotMax,
          hotFloor: HOT_MAX_FLOOR,
          admAvailable,
        });
        return exportPng(
          { kind: "map", legend, scale: EXPORT_SCALE },
          mapPngFilename(mapType, Date.now()),
        );
      }),
    [
      run,
      mapType,
      effectiveMode,
      overlay,
      activityLookup,
      activityError,
      activityRangeLabel,
      filterActive,
      jumpsLookup,
      jumpsError,
      entries,
      mapSystemIDs,
      admAvailable,
    ],
  );

  useEffect(() => {
    const fn = exportPngNow;
    setExportMapPngFn(fn);
    return () => {
      if (exportMapPngFn === fn) setExportMapPngFn(null);
    };
  }, [exportPngNow]);

  return { exportPng: exportPngNow, busy, error };
}

export function useSystemExport(
  systemData: SystemData,
  typeRadii: TypeRadiiData,
  slug: string,
) {
  const { busy, error, run } = useAsyncExport();
  const filtered = useKillStore((s) => s.filteredKills);
  const maxKills = useSystemSettingsStore((s) => s.maxKills);
  const triglavianFont = useGlobalSettingsStore((s) => s.triglavianFont);
  const csvRowCount = filtered?.count ?? 0;
  const csvCapped = csvRowCount >= maxKills;

  const exportPngNow = useCallback(
    () =>
      run(async () => {
        const playbackActive = usePlaybackStore.getState().isActive;
        const ms = exportTimeMs(
          playbackActive,
          playbackTimeState.currentTime,
          Date.now(),
        );
        const useTrig =
          triglavianFont &&
          isTriglavianSystem(systemData.solarSystemID) &&
          typeof document !== "undefined" &&
          document.fonts?.check(
            `bold ${24 * EXPORT_SCALE}px ${TRIGLAVIAN_FONT}`,
          );
        const focus = await exportFocus(systemData, typeRadii);
        await exportPng(
          {
            kind: "system",
            header: {
              ...systemHeaderSpec(
                systemData,
                systemData.stargates?.length ?? 0,
              ),
              focus,
            },
            timeLabel: timeLabelFor(playbackActive, ms),
            scale: EXPORT_SCALE,
            nameFont: useTrig
              ? `bold ${24 * EXPORT_SCALE}px ${TRIGLAVIAN_FONT}`
              : undefined,
          },
          systemPngFilename(slug, ms),
        );
      }),
    [run, systemData, typeRadii, slug, triglavianFont],
  );

  const exportCsvNow = useCallback(
    () =>
      run(async () => {
        const state = useKillStore.getState();
        const rows = resolveCsvRows(state.filteredKills, state.data !== null);
        const shipNames = await loadShipTypeNames().catch(
          () => new Map<number, string>(),
        );
        const csv = buildKillCsv(rows, {
          shipNames,
          nearest: (pos) => findNearestObject(pos, systemData, typeRadii),
        });
        downloadBlob(
          new Blob([csv], { type: "text/csv;charset=utf-8" }),
          killCsvFilename(slug, Date.now()),
        );
      }),
    [run, systemData, typeRadii, slug],
  );

  useEffect(() => {
    const pngFn = exportPngNow;
    const csvFn = exportCsvNow;
    setExportSystemPngFn(pngFn);
    setExportSystemCsvFn(csvFn);
    return () => {
      if (exportSystemPngFn === pngFn) setExportSystemPngFn(null);
      if (exportSystemCsvFn === csvFn) setExportSystemCsvFn(null);
    };
  }, [exportPngNow, exportCsvNow]);

  return {
    exportPng: exportPngNow,
    exportCsv: exportCsvNow,
    csvRowCount,
    csvCapped,
    busy,
    error,
  };
}
