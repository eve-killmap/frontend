import { useEffect } from "react";
import { API_BASE_WS } from "@/lib/net/endpoints";
import { useReconnectingWebSocket } from "@/hooks/use-reconnecting-web-socket";
import { ingestLiveKillFrame } from "@/lib/net/ingest-live-kill";
import { useLiveKillStore, EXPIRY_TICK_MS } from "@/stores/live-kill-store";

export function LiveKillConnection() {
  const setConnected = useLiveKillStore((s) => s.setConnected);
  const expire = useLiveKillStore((s) => s.expire);

  useReconnectingWebSocket(`${API_BASE_WS}/ws/global/kills`, {
    onOpen: () => setConnected(true),
    onMessage: (data) => {
      ingestLiveKillFrame(data);
    },
    onClose: () => setConnected(false),
  });

  useEffect(() => {
    const id = setInterval(() => expire(), EXPIRY_TICK_MS);
    return () => clearInterval(id);
  }, [expire]);

  return null;
}
