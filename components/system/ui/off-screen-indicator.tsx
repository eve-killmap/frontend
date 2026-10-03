import { useEffect, useRef } from "react";
import { offScreenIndicator } from "@/lib/system/off-screen-indicator-state";

export function OffScreenIndicator() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        if (offScreenIndicator.visible) {
          el.style.display = "block";
          el.style.transform = `translate(-50%, -50%) translate(${offScreenIndicator.x}px, ${offScreenIndicator.y}px) rotate(${offScreenIndicator.angleDeg}deg)`;
        } else {
          el.style.display = "none";
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: "none",
        position: "fixed",
        left: 0,
        top: 0,
        pointerEvents: "none",
        zIndex: "var(--z-index-panel)",
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderTop: "12px solid transparent",
          borderBottom: "12px solid transparent",
          borderLeft: "24px solid #ffffff",
          filter: "drop-shadow(0 0 2px rgba(0,0,0,0.9))",
        }}
      />
    </div>
  );
}
