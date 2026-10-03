import { Info } from "lucide-react";
import { useSharedViewStore } from "@/stores/system/shared-view-store";

const SHARE_PARAMS = ["s", "t", "cam", "tgt"] as const;

function stripShareParams(): void {
  const url = new URL(window.location.href);
  let changed = false;
  for (const key of SHARE_PARAMS) {
    if (url.searchParams.has(key)) {
      url.searchParams.delete(key);
      changed = true;
    }
  }
  if (!changed) return;
  const qs = url.searchParams.toString();
  window.history.replaceState(
    null,
    "",
    `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`,
  );
}

export function SharedViewNotice() {
  const active = useSharedViewStore((s) => s.active);
  const exit = useSharedViewStore((s) => s.exit);
  if (!active) return null;

  const reset = () => {
    exit(true);
    stripShareParams();
  };

  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 border border-capsuleer/40 bg-panel px-2.5 py-2 text-2xs">
      <div className="flex items-center gap-2 text-fg-muted">
        <Info className="size-3.5 shrink-0 text-capsuleer" />
        <span>
          Shared view - settings changes won&apos;t be saved this session.
        </span>
      </div>
      <button
        onClick={reset}
        className="self-start text-capsuleer underline underline-offset-2 hover:text-capsuleer/80 cursor-pointer"
      >
        Reset to my settings
      </button>
    </div>
  );
}
