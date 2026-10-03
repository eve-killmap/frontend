import { useEffect, useRef } from "react";
import { useKillStore } from "@/stores/kill-store";
import { decodeSystemShare } from "@/lib/system/share/system-share";
import { applySharedPlayback } from "@/lib/system/share/apply";

export function ApplySharedPlayback() {
  const data = useKillStore((s) => s.data);
  const isLoading = useKillStore((s) => s.isLoading);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    const share = decodeSystemShare(
      new URLSearchParams(window.location.search),
    );
    if (!share.playback) {
      applied.current = true;
      return;
    }
    if (isLoading || data === null) return;
    applied.current = true;
    applySharedPlayback(share.playback);
  }, [data, isLoading]);

  return null;
}
