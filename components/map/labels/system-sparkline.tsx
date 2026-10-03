import { useMemo } from "react";
import { Eyebrow } from "@/components/common/eyebrow";
import { DensitySkeleton } from "@/components/common/density-skeleton";
import { useSystemActivity } from "@/hooks/map/use-system-activity";
import { densityPaths } from "@/lib/ui/density";

const SPARK_HEIGHT = 32;

export function SystemSparkline({ systemID }: { systemID: number }) {
  const { counts, loading, error } = useSystemActivity(systemID);
  const bins = counts?.length ?? 0;
  const paths = useMemo(
    () => (counts ? densityPaths(counts, SPARK_HEIGHT) : null),
    [counts],
  );
  const total = useMemo(
    () => (counts ? counts.reduce((sum, c) => sum + c, 0) : null),
    [counts],
  );

  return (
    <div className="min-w-36 rounded-sm px-1 py-1 text-xs select-none ring-1 ring-border/50 text-foreground bg-panel border border-border whitespace-nowrap pointer-events-none">
      <div className="flex items-baseline justify-between gap-2">
        <Eyebrow>Activity (last 12h)</Eyebrow>
        {total != null && (
          <span className="font-mono text-2xs text-fg-muted">
            {total.toLocaleString()}
          </span>
        )}
      </div>
      <div
        className="mt-0.5 flex items-center"
        style={{ height: SPARK_HEIGHT }}
      >
        {loading ? (
          <DensitySkeleton height={SPARK_HEIGHT} />
        ) : error ? (
          <span className="text-2xs text-fg-muted">Unavailable</span>
        ) : paths ? (
          <svg
            viewBox={`0 0 ${bins} ${SPARK_HEIGHT}`}
            preserveAspectRatio="none"
            width="100%"
            height={SPARK_HEIGHT}
            style={{ display: "block" }}
            aria-hidden="true"
          >
            <path
              d={paths.areaPath}
              fillOpacity={0.32}
              className="fill-capsuleer"
            />
            <path
              d={paths.linePath}
              fill="none"
              strokeOpacity={0.85}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              className="stroke-capsuleer"
            />
          </svg>
        ) : (
          <span className="text-2xs text-fg-muted">
            No kills in the last 12h
          </span>
        )}
      </div>
    </div>
  );
}
