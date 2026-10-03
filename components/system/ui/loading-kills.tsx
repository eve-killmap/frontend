import { useKillStore } from "@/stores/kill-store";
import { CAPSULEER } from "@/lib/theme-colors";
import { BarLoader } from "react-spinners";

export function LoadingKills() {
  const isLoading = useKillStore((s) => s.isLoading);

  if (!isLoading) return null;

  return (
    <div className="absolute top-1/6 left-1/2 -translate-x-1/2 text-xl text-fg-strong pointer-events-none">
      <div className="flex flex-col items-center gap-1">
        <span>Loading kills...</span>
        <BarLoader
          color={CAPSULEER}
          loading={true}
          width={150}
          speedMultiplier={0.8}
        />
      </div>
    </div>
  );
}
