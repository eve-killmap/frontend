import { RefObject, useEffect, useRef } from "react";

export function useDismissablePanel<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
  ignoredRefs: ReadonlyArray<RefObject<HTMLElement | null>> = [],
): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const isInside = (target: Node | null): boolean => {
      if (!target) return false;
      if (ref.current?.contains(target)) return true;
      for (const r of ignoredRefs) {
        if (r.current?.contains(target)) return true;
      }
      const el =
        target instanceof Element ? target : (target.parentElement ?? null);
      if (
        el?.closest(
          "[data-radix-popper-content-wrapper],[data-slot='dialog-content'],[data-slot='dialog-overlay']",
        )
      ) {
        return true;
      }
      return false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!isInside(e.target as Node)) onCloseRef.current();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) onCloseRef.current();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ...ignoredRefs]);

  return ref;
}
