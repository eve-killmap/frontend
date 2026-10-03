export function DensitySkeleton({ height }: { height: number }) {
  return (
    <svg
      viewBox="0 0 300 40"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      style={{ display: "block" }}
    >
      <path
        d="M 0.5 38 C 40 28, 70 22, 100 26 C 130 30, 155 16, 185 21 C 215 26, 250 19, 299.5 32 L 299.5 40 L 0.5 40 Z"
        fillOpacity={0.08}
        className="fill-capsuleer animate-pulse"
      />
      <path
        d="M 0.5 38 C 40 28, 70 22, 100 26 C 130 30, 155 16, 185 21 C 215 26, 250 19, 299.5 32"
        fill="none"
        strokeOpacity={0.18}
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
        className="stroke-capsuleer animate-pulse"
      />
    </svg>
  );
}
