import { useState } from "react";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ExportAction {
  key: string;
  label: string;
  run: () => Promise<void>;
}

export function ExportBlock({
  actions,
  busy,
  error,
}: {
  actions: ExportAction[];
  busy: boolean;
  error: string | null;
}) {
  const [active, setActive] = useState<string | null>(null);

  async function handleClick(a: ExportAction) {
    setActive(a.key);
    try {
      await a.run();
    } finally {
      setActive(null);
    }
  }

  return (
    <div className="space-y-1.5 border-t border-border/60 pt-2 mt-1">
      <p className="text-sm font-medium text-fg-secondary leading-tight">
        Export
      </p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => {
          const spinning = busy && active === a.key;
          return (
            <Button
              key={a.key}
              variant="outline"
              size="sm"
              className="btn-glass h-8 cursor-pointer"
              disabled={busy}
              onClick={() => void handleClick(a)}
            >
              {spinning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              {spinning ? "Exporting…" : a.label}
            </Button>
          );
        })}
      </div>
      {error && (
        <p role="alert" className="text-2xs text-red-400 leading-tight">
          {error}
        </p>
      )}
    </div>
  );
}
