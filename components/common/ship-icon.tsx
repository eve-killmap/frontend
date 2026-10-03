import { useEffect, useState } from "react";
import { shipIconUrl, shipRenderUrl } from "@/lib/eve/eve-images";
import {
  loadTypeMetaIndex,
  overlayPathForType,
  peekTypeMetaIndex,
} from "@/lib/eve/meta-overlay";
import { cn } from "@/lib/ui/cn";

export function ShipIcon({
  typeId,
  name,
  size = 64,
  className,
}: {
  typeId: number;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(peekTypeMetaIndex);

  useEffect(() => {
    if (index) return;
    let alive = true;
    loadTypeMetaIndex()
      .then((loaded) => {
        if (alive) setIndex(loaded);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [index]);

  const overlay = index ? overlayPathForType(typeId, index) : null;

  return (
    <span
      title={name ?? undefined}
      className={cn(
        "relative inline-block w-12 h-12 rounded-sm bg-elevated-subtle shrink-0 overflow-hidden",
        className,
      )}
    >
      <img
        key={typeId}
        src={shipRenderUrl(typeId, size)}
        alt=""
        loading="lazy"
        decoding="async"
        onError={(e) => {
          const img = e.currentTarget;
          if (img.dataset.fallback) return;
          img.dataset.fallback = "1";
          img.src = shipIconUrl(typeId, size);
        }}
        className="block w-full h-full"
      />
      {overlay ? (
        <img
          src={overlay}
          alt=""
          className="absolute top-0 left-0 w-1/4 h-auto pointer-events-none"
        />
      ) : null}
    </span>
  );
}
