import { useEffect, useMemo, useRef } from "react";
import { createClickGate, DOUBLE_CLICK_MS } from "@/lib/ui/click-gate";

export function useClickGate(
  onSingle: () => void,
  onDouble: (() => void) | undefined,
  delayMs: number = DOUBLE_CLICK_MS,
): { click: (detail: number) => void; doubleClick: () => void } {
  const singleRef = useRef(onSingle);
  const doubleRef = useRef(onDouble);
  singleRef.current = onSingle;
  doubleRef.current = onDouble;
  const hasDouble = onDouble !== undefined;

  const gate = useMemo(
    () =>
      createClickGate(
        () => singleRef.current(),
        hasDouble ? () => doubleRef.current?.() : undefined,
        delayMs,
      ),
    [hasDouble, delayMs],
  );

  useEffect(() => () => gate.dispose(), [gate]);

  return gate;
}
