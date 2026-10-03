import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { SystemData, TypeData, SlugIndex } from "@/lib/schema/system-schema";
import {
  BuildInfoSchema,
  FarthestKillDataSchema,
  SlugIndexSchema,
  SystemDataSchema,
  TypeDataSchema,
} from "@/lib/schema/system-schema.zod";
import LoadingPage from "@/components/loading";
import { ErrorPageView } from "@/components/error-page";
import { SolarSystemCanvas } from "@/components/system/solar-system-canvas";
import { SolarSystemUI } from "@/components/system/ui/solar-system-ui";
import { API_BASE, BACKEND_BASE_URL } from "@/lib/net/endpoints";
import { BuildInfo } from "@/lib/schema/base-schema";
import { apiFetch } from "@/lib/api/client";
import { TooltipProvider } from "../ui/tooltip";
import {
  setCurrentSystemSlug,
  setSettingsPersistPaused,
  snapshotCurrentSettings,
} from "@/stores/system/system-settings-store";
import {
  setTimeRangePersistPaused,
  snapshotTimeRange,
} from "@/stores/time-range-store";
import { setCurrentCameraSlug } from "@/stores/system/camera-state-store";
import { useSharedViewStore } from "@/stores/system/shared-view-store";
import { processSystemData } from "@/stores/system/system-object-name-store";
import { resetPerSystemState } from "@/lib/system/reset-per-system-state";
import { useDocumentTitle } from "@/lib/document-title";
import { useSystemHistoryStore } from "@/stores/system/system-history-store";
import { decodeSystemShare } from "@/lib/system/share/system-share";
import { applySharedSettings } from "@/lib/system/share/apply";
import { ApplySharedPlayback } from "@/components/system/ui/share/apply-shared-playback";

let sdeInfoCache: Promise<BuildInfo> | null = null;
function fetchSDEInfo(): Promise<BuildInfo> {
  if (!sdeInfoCache)
    sdeInfoCache = fetchSDEInfoUncached().catch((e) => {
      sdeInfoCache = null;
      throw e;
    });
  return sdeInfoCache;
}
async function fetchSDEInfoUncached(): Promise<BuildInfo> {
  return apiFetch(`${BACKEND_BASE_URL}/static/latest.json`, BuildInfoSchema, {
    cache: "no-cache",
  });
}

let slugIndexCache: Promise<SlugIndex> | null = null;
function getSlugIndex(): Promise<SlugIndex> {
  if (!slugIndexCache)
    slugIndexCache = apiFetch(
      `${BACKEND_BASE_URL}/static/universe/slug_index.json`,
      SlugIndexSchema,
      { cache: "no-cache" },
    ).catch((e) => {
      slugIndexCache = null;
      throw e;
    });
  return slugIndexCache;
}

async function fetchSystem(systemName: string): Promise<SystemData> {
  const slugIndex = await getSlugIndex();
  const solarSystemID = slugIndex[encodeURIComponent(systemName)];
  if (!solarSystemID) throw new Error(`Solar system ${systemName} not found`);

  return apiFetch(
    `${BACKEND_BASE_URL}/static/system/${solarSystemID}.json`,
    SystemDataSchema,
    { cache: "no-cache" },
  );
}

let typeDataCache: Promise<TypeData> | null = null;
function fetchTypes(): Promise<TypeData> {
  if (!typeDataCache)
    typeDataCache = fetchTypesUncached().catch((e) => {
      typeDataCache = null;
      throw e;
    });
  return typeDataCache;
}
async function fetchTypesUncached(): Promise<TypeData> {
  const base = `${BACKEND_BASE_URL}/static/type`;

  const [
    bracketData,
    groupNameData,
    typeBracketData,
    typeNameData,
    typeTreeData,
    typeRadiiData,
    npcTypeData,
  ] = await Promise.all([
    apiFetch(`${base}/brackets.json`, z.unknown(), { cache: "no-cache" }),
    apiFetch(`${base}/groupNames.json`, z.unknown(), { cache: "no-cache" }),
    apiFetch(`${base}/typeBrackets.json`, z.unknown(), { cache: "no-cache" }),
    apiFetch(`${base}/typeNames.json`, z.unknown(), { cache: "no-cache" }),
    apiFetch(`${base}/typeTree.json`, z.unknown(), { cache: "no-cache" }),
    apiFetch(`${base}/typeRadii.json`, z.unknown(), { cache: "no-cache" }),
    apiFetch(`${base}/npcTypes.json`, z.unknown(), { cache: "no-cache" }),
  ]);

  return TypeDataSchema.parse({
    brackets: bracketData,
    groupNames: groupNameData,
    typeBrackets: typeBracketData,
    typeNames: typeNameData,
    typeTree: typeTreeData,
    typeRadii: typeRadiiData,
    npcTypes: npcTypeData,
  });
}

async function fetchFarthestKill(solarSystemID: number): Promise<number> {
  const data = await apiFetch(
    `${API_BASE}/systems/${solarSystemID}/farthest_kill`,
    FarthestKillDataSchema,
  );
  return data.farthest_kill;
}

interface SystemPageClientProps {
  slug: string;
}

export function SystemPageClient({ slug }: SystemPageClientProps) {
  const [sdeInfo, setSDEInfo] = useState<BuildInfo | null>(null);
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [farthestKill, setFarthestKill] = useState<number | null>(null);
  const [typeData, setTypeData] = useState<TypeData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const sharedSettingsApplied = useRef(false);

  useDocumentTitle(error ? undefined : (systemData?.name ?? null));

  useEffect(() => {
    return () => {
      useSharedViewStore.getState().exit();
      setCurrentSystemSlug(null);
      setCurrentCameraSlug(null);
      resetPerSystemState();
    };
  }, []);

  useEffect(() => {
    let canceled = false;
    setError(null);
    setSystemData(null);
    setFarthestKill(null);
    setTypeData(null);

    Promise.all([fetchSDEInfo(), fetchSystem(slug), fetchTypes()])
      .then(([sdeInfo, system, types]) =>
        fetchFarthestKill(system.solarSystemID)
          .catch(() => 0)
          .then((farthest) => ({ sdeInfo, system, types, farthest })),
      )
      .then(({ sdeInfo, system, types, farthest }) => {
        if (canceled) return;
        processSystemData(system);
        setSDEInfo(sdeInfo);
        setSystemData(system);
        setTypeData(types);
        setFarthestKill(farthest ?? null);
      })
      .catch((e) => {
        if (canceled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      });

    return () => {
      canceled = true;
    };
  }, [slug, retryCount]);

  useEffect(() => {
    if (systemData) useSystemHistoryStore.getState().recordVisit(slug);
  }, [systemData, slug]);

  if (error) {
    const isNotFound = error.message.toLowerCase().includes("not found");
    return (
      <ErrorPageView
        message={error.message}
        errorCode={isNotFound ? "ERR_NOT_FOUND" : "ERR_LOAD_FAILED"}
        heading={isNotFound ? "System not found" : "Couldn't load this system"}
        subheading={
          isNotFound
            ? "This solar system doesn't exist."
            : "The requested solar system could not be loaded."
        }
        onRetry={isNotFound ? undefined : () => setRetryCount((c) => c + 1)}
        reportable={!isNotFound}
      />
    );
  }

  if (!sdeInfo || !systemData || !typeData) return <LoadingPage />;

  setCurrentSystemSlug(slug);
  setCurrentCameraSlug(slug);

  if (!sharedSettingsApplied.current) {
    sharedSettingsApplied.current = true;
    const share = decodeSystemShare(
      new URLSearchParams(window.location.search),
    );
    if (share.settings) {
      setSettingsPersistPaused(true);
      setTimeRangePersistPaused(true);
      const snapshot = snapshotCurrentSettings();
      const timeRangeSnapshot = snapshotTimeRange();
      applySharedSettings(share.settings);
      useSharedViewStore.getState().enter(snapshot, timeRangeSnapshot);
    }
  }

  return (
    <div className="relative w-full h-screen bg-abyss">
      <SolarSystemCanvas
        slug={slug}
        farthestKill={farthestKill ?? 0}
        systemData={systemData}
      />
      <ApplySharedPlayback />
      <TooltipProvider>
        <SolarSystemUI
          sdeInfo={sdeInfo}
          systemData={systemData}
          typeData={typeData}
        />
      </TooltipProvider>
    </div>
  );
}
