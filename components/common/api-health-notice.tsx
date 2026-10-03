import { useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ErrorContent } from "@/components/error-page";
import { useApiHealthStore } from "@/stores/api-health-store";
import { useBlockingErrorStore } from "@/stores/blocking-error-store";

export function ApiHealthNotice() {
  const [dismissed, setDismissed] = useState(false);
  const unhealthy = useApiHealthStore((s) => s.healthy === false);
  const blockingError = useBlockingErrorStore((s) => s.count > 0);

  return (
    <Dialog
      open={unhealthy && !dismissed && !blockingError}
      onOpenChange={(open) => {
        if (!open) setDismissed(true);
      }}
    >
      <DialogContent showCloseButton={false} className="rounded-none max-w-lg">
        <DialogTitle className="sr-only">API unavailable</DialogTitle>
        <DialogDescription className="sr-only">
          EVE Killmap can't reach its API right now. The static site still
          works, but live and API-backed features are unavailable.
        </DialogDescription>
        <ErrorContent
          tone="warning"
          heading="API unavailable"
          errorCode="ERR_API_UNAVAILABLE"
          subheading={
            <>
              EVE Killmap can't reach its API right now. New kills and other
              data won't be shown, and many features will not work. This is
              usually a temporary issue, but if it persists, please check the{" "}
              <a
                href="https://status.eve-killmap.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong className="text-fg-strong hover:text-capsuleer transition-colors">
                  status page
                </strong>
              </a>
              .
            </>
          }
          actions={
            <DialogClose asChild>
              <Button
                variant="ghost"
                className="text-sm px-5 py-2 border border-capsuleer/50 text-capsuleer hover:text-capsuleer hover:bg-capsuleer/10 hover:border-capsuleer/80 transition-colors cursor-pointer"
              >
                Continue anyway
              </Button>
            </DialogClose>
          }
        />
      </DialogContent>
    </Dialog>
  );
}
