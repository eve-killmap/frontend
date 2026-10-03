import React, { useRef, useEffect } from "react";
import { SystemData } from "@/lib/schema/system-schema";
import { useKills } from "@/hooks/system/use-kills";
import { useKillFiltering } from "@/hooks/system/use-kill-filtering";
import { useSystemKillFeed } from "@/hooks/system/use-system-kill-feed";
import { useSystemSettingsStore } from "@/stores/system/system-settings-store";
import { useKillStore } from "@/stores/kill-store";
import { navigateToKillFn } from "@/lib/camera-functions";
import { KillOctreeTraverser } from "./kill-octree-traverser";
import { KillInstances } from "./kill-instances";
import { ClusterInstances } from "./cluster-instances";
import { ClusterLabels } from "./cluster-labels";
import { KillFlash3D } from "./kill-flash-3d";
import { KillLocatorRing } from "./kill-locator-ring";

function SystemKillFeedConnected({ solarSystemId }: { solarSystemId: number }) {
  useSystemKillFeed(solarSystemId);
  const showKillFlash = useSystemSettingsStore((s) => s.showKillFlash);
  return showKillFlash ? <KillFlash3D /> : null;
}

interface KillLayerProps {
  slug: string;
  systemData: SystemData;
  deepLinkKillId: number | null;
}

export const KillLayer = React.memo(function KillLayer({
  systemData,
  deepLinkKillId,
}: KillLayerProps) {
  useKills(systemData.solarSystemID);
  useKillFiltering(systemData);
  const enableKillFeed = useSystemSettingsStore((s) => s.enableKillFeed);
  const data = useKillStore((s) => s.data);

  const navigated = useRef(false);
  useEffect(() => {
    if (!data || !deepLinkKillId || navigated.current) return;
    const idx = data.killmail_ids.indexOf(deepLinkKillId);
    if (idx === -1) return;
    navigated.current = true;
    navigateToKillFn?.([data.x[idx], data.y[idx], data.z[idx]]);
  }, [data, deepLinkKillId]);

  return (
    <>
      <KillOctreeTraverser />
      <KillInstances />
      <KillLocatorRing />
      <ClusterInstances />
      <ClusterLabels />
      {enableKillFeed && (
        <SystemKillFeedConnected solarSystemId={systemData.solarSystemID} />
      )}
    </>
  );
});
