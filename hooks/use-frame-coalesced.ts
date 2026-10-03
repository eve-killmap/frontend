import { useEffect, useRef } from "react";
import { createFrameCoalescer, FrameCoalescer } from "@/lib/ui/frame-coalesce";

export function useFrameCoalesced<T>(
  apply: (value: T) => void,
): (v: T) => void {
  const applyRef = useRef(apply);
  applyRef.current = apply;

  const coalescerRef = useRef<FrameCoalescer<T> | null>(null);
  if (coalescerRef.current === null) {
    coalescerRef.current = createFrameCoalescer<T>((v) => applyRef.current(v));
  }

  useEffect(() => {
    const c = coalescerRef.current;
    return () => c?.flush();
  }, []);

  const pushRef = useRef((v: T) => coalescerRef.current?.push(v));
  return pushRef.current;
}
