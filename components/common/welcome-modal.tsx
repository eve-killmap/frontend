import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "eve-killmap-welcomed";

function readWelcomed(): boolean {
  try {
    return !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

function writeWelcomed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore
  }
}

export function WelcomeModal() {
  const [open, setOpen] = useState(() => !readWelcomed());

  function handleOpenChange(next: boolean) {
    if (!next) {
      writeWelcomed();
    }
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="rounded-none max-w-lg">
        <div className="space-y-4 font-sans">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-capsuleer shrink-0" />
              <DialogTitle className="text-foreground text-xl font-semibold">
                Welcome to EVE Killmap
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-fg-secondary leading-relaxed">
              EVE Killmap is an interactive 3D visualization of kill data across
              New Eden. Navigate between solar systems, explore kill clusters,
              and analyze combat activity over time.
            </DialogDescription>
          </div>

          <div className="border-t border-border/50" />

          <div className="flex gap-3">
            <ShieldCheck className="w-4 h-4 text-fg-subtle shrink-0 mt-0.5" />
            <p className="text-xs text-fg-faint leading-relaxed">
              EVE Killmap stores kill data and your settings in your browser's
              local storage to improve performance between sessions. No personal
              data is collected or transmitted.
            </p>
          </div>

          <div className="flex justify-end pt-1">
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="text-sm px-5 py-2 border border-capsuleer/50 text-capsuleer hover:text-capsuleer hover:bg-capsuleer/10 hover:border-capsuleer/80 transition-colors cursor-pointer"
              >
                Get started
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
