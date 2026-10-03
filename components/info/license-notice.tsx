import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export function LicenseNotice({
  label,
  text,
}: {
  label: string;
  text: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mt-2">
      <CollapsibleTrigger className="text-fg-subtle border-border bg-panel-elevated hover:border-capsuleer/50 hover:text-capsuleer flex cursor-pointer items-center gap-1.5 border px-2 py-1 text-3xs font-mono uppercase tracking-widest transition-colors">
        {label}
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="bg-elevated-subtle text-fg-muted text-2xs mt-2 max-w-2xl overflow-x-auto p-3 font-mono whitespace-pre-wrap">
          {text}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
