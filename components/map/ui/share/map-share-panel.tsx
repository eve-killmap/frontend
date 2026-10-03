import { useMemo } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShareLinkField } from "@/components/common/share-link-field";
import { ExportBlock } from "@/components/common/export-block";
import { filterToSearch } from "@/lib/filter/serialize";
import { useFilterConditions } from "@/stores/filter-store";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { useMapExport } from "@/hooks/use-export";

export function MapSharePanel({
  open,
  onToggle,
  mapType,
}: {
  open: boolean;
  onToggle: () => void;
  mapType: string;
}) {
  const conditions = useFilterConditions();
  const mapExport = useMapExport(mapType);
  const link = useMemo(
    () =>
      `${window.location.origin}${window.location.pathname}${filterToSearch(conditions)}`,
    [conditions],
  );
  const ref = useDismissablePanel(open, onToggle);
  return (
    <div ref={ref} className="relative pointer-events-auto">
      <Button
        variant="outline"
        size="lg"
        onClick={onToggle}
        aria-expanded={open}
        className="btn-glass"
        title="Share"
      >
        <Share2 />
        <span className="btn-label">Share</span>
      </Button>
      <Card
        className={`absolute top-full right-0 w-84 mt-2 max-w-[calc(100vw-2rem)] panel-glass ${open ? "" : "hidden"}`}
      >
        <CardContent className="px-3">
          <div className="space-y-1.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-fg-secondary leading-tight">
                Share Link
              </p>
              <p className="text-xs text-fg-muted leading-tight">
                Create a shareable link to this map with the current kill filter
                applied.
              </p>
            </div>
            <ShareLinkField link={link} />
            <ExportBlock
              actions={[
                { key: "png", label: "Download PNG", run: mapExport.exportPng },
              ]}
              busy={mapExport.busy}
              error={mapExport.error}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
