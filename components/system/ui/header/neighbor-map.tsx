import React, { useState } from "react";
import { IntactStargateData } from "@/lib/schema/system-schema";
import { slugify } from "@/lib/formatting/slugify";
import { AppLink } from "@/components/common/app-link";
import { ChevronUp } from "lucide-react";

const SVG_SIZE = 130;
const PADDING = 8;
const PLOT_SIZE = SVG_SIZE - 2 * PADDING;
const CURRENT_R = 4;
const NEIGHBOR_R = 3;
const LABEL_FONT_SIZE = 14;

const DOT_COLOR = "rgba(255,255,255,0.85)";

const LINE_COLOR: Record<number, string> = {
  1: "rgba(0,0,255,0.6)",
  2: "rgba(255,0,0,0.6)",
  3: "rgba(128,0,128,0.6)",
};

interface NeighborMapProps {
  intactStargates: IntactStargateData[];
  jumps: number | null;
}

export const NeighborMap = React.memo(function NeighborMap({
  intactStargates,
  jumps,
}: NeighborMapProps) {
  const [expanded, setExpanded] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const jumpsSuffix =
    jumps != null ? ` · ${jumps.toLocaleString()} jumps (1h)` : "";

  if (intactStargates.length === 0) {
    return (
      <p className="text-xs text-fg-muted tracking-widest uppercase">
        0 Connections{jumpsSuffix}
      </p>
    );
  }

  const toggle = () => setExpanded((prev) => !prev);

  if (!expanded) {
    return (
      <button
        onClick={toggle}
        className="text-xs text-fg-muted hover:text-fg-strong transition-colors tracking-widest uppercase pointer-events-auto hover:cursor-pointer"
      >
        {intactStargates.length}{" "}
        {intactStargates.length === 1 ? "connection" : "connections"}
        {jumpsSuffix}
      </button>
    );
  }

  const allX = [0, ...intactStargates.map((n) => n.position2D.x)];
  const allY = [0, ...intactStargates.map((n) => n.position2D.y)];
  const minX = Math.min(...allX),
    maxX = Math.max(...allX);
  const minY = Math.min(...allY),
    maxY = Math.max(...allY);
  const range = Math.max(maxX - minX, maxY - minY) || 1;
  const scale = PLOT_SIZE / range;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const toSVG = (x: number, y: number): [number, number] => [
    SVG_SIZE / 2 + (x - cx) * scale,
    SVG_SIZE / 2 - (y - cy) * scale,
  ];

  const [curX, curY] = toSVG(0, 0);

  return (
    <div className="relative flex flex-col items-center gap-0.5 pointer-events-auto">
      <div className="relative">
        <svg
          width={SVG_SIZE}
          height={SVG_SIZE}
          style={{ display: "block", overflow: "visible" }}
        >
          {intactStargates.map((n, i) => {
            const [nx, ny] = toSVG(n.position2D.x, n.position2D.y);
            const lc = LINE_COLOR[n.jumpType] ?? LINE_COLOR[1];
            return (
              <line
                key={i}
                x1={curX}
                y1={curY}
                x2={nx}
                y2={ny}
                stroke={lc}
                strokeWidth={2}
              />
            );
          })}

          {intactStargates.map((n, i) => {
            const [nx, ny] = toSVG(n.position2D.x, n.position2D.y);
            const hovered = hoveredIdx === i;
            return (
              <AppLink
                key={i}
                to={`/${slugify(n.destName)}`}
                aria-label={n.destName}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                onFocus={() => setHoveredIdx(i)}
                onBlur={() => setHoveredIdx(null)}
              >
                <circle
                  cx={nx}
                  cy={ny}
                  r={hovered ? NEIGHBOR_R + 1 : NEIGHBOR_R}
                  fill={DOT_COLOR}
                  opacity={hovered ? 1 : 0.7}
                />
                {hovered && (
                  <text
                    x={nx}
                    y={ny - NEIGHBOR_R - 3}
                    textAnchor="middle"
                    fill="white"
                    fontSize={LABEL_FONT_SIZE}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {n.destName}
                  </text>
                )}
              </AppLink>
            );
          })}

          <circle
            cx={curX}
            cy={curY}
            r={CURRENT_R}
            fill="white"
            style={{ pointerEvents: "none" }}
          />
        </svg>

        <button
          onClick={toggle}
          className="absolute top-0 -right-8 flex items-center gap-0.5 text-fg-subtle hover:text-fg-secondary transition-colors text-lg leading-none select-none hover:cursor-pointer"
          style={{ lineHeight: 1 }}
        >
          <ChevronUp size={12} />
          <span className="text-xs">Hide</span>
        </button>
      </div>

      <div className="text-3xs text-fg-subtle tracking-widest uppercase select-none">
        {intactStargates.length}{" "}
        {intactStargates.length === 1 ? "connection" : "connections"}
        {jumpsSuffix}
      </div>
    </div>
  );
});
