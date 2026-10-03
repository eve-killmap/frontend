import { useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDismissablePanel } from "@/hooks/use-dismissable-panel";
import { TimeSelector } from "@/components/common/time-selector";

export function TimeRangePrecisionPopover({
  dayOnly = false,
}: { dayOnly?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const ref = useDismissablePanel(open, () => setOpen(false));

  return (
    <div ref={ref} className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`btn-glass text-xs ${open ? "text-capsuleer border-capsuleer/60" : ""}`}
      >
        <CalendarClock />
        Custom
      </Button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-80 max-w-[calc(100vw-2rem)] bg-panel border border-border p-3">
          <TimeSelector
            dayOnly={dayOnly}
            lastButtons={[]}
            requireData={!dayOnly}
          />
        </div>
      )}
    </div>
  );
}
