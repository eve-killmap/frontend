import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareLinkField({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };
  return (
    <div className="flex items-center gap-2 pt-0.5">
      <input
        readOnly
        value={link}
        onFocus={(e) => e.currentTarget.select()}
        aria-label="Shareable link"
        className="flex-1 min-w-0 h-8 border border-border bg-elevated-subtle px-2 text-2xs font-mono text-fg-secondary truncate"
      />
      <Button
        variant="outline"
        size="sm"
        className="btn-glass h-8 cursor-pointer shrink-0"
        onClick={copy}
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}
