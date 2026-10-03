import { useUniverseStatusStore } from "@/stores/map/universe-status-store";

export function ServerStatus() {
  const status = useUniverseStatusStore((s) => s.status);
  const stale = useUniverseStatusStore((s) => s.stale);

  if (!status) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-fg-muted select-none whitespace-nowrap">
      <span>EVE Servers:</span>
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status.online ? "bg-green-400" : "bg-red-500"
        } ${stale ? "opacity-40" : ""}`}
      />
      <span className="text-fg-secondary tabular-nums">
        {status.online && status.players != null
          ? `${status.players.toLocaleString()} players`
          : status.online
            ? "Online"
            : "Offline"}
      </span>
    </div>
  );
}
