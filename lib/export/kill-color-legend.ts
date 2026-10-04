import type { TypeData } from "@/lib/schema/system-schema";
import type { LegendSpec } from "./legend-spec";

export interface KillColorSettings {
  defaultColor: string;
  groupColors: Record<number, string>;
  typeColors: Record<number, string>;
}

export const ALL_OTHERS_LABEL = "All others";

function named(
  colors: Record<number, string>,
  names: Record<string, string>,
  fallback: string,
): { label: string; hex: string }[] {
  return Object.entries(colors)
    .map(([id, hex]) => ({ label: names[id] ?? `${fallback} ${id}`, hex }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function killColorLegend(
  settings: KillColorSettings,
  typeData: Pick<TypeData, "groupNames" | "typeNames">,
): LegendSpec[] {
  const custom = [
    ...named(settings.groupColors, typeData.groupNames, "Group"),
    ...named(settings.typeColors, typeData.typeNames, "Type"),
  ];
  if (custom.length === 0) return [];
  const byHex = new Map<string, string[]>();
  for (const { label, hex } of custom) {
    const key = hex.toLowerCase();
    const labels = byHex.get(key);
    if (labels) labels.push(label);
    else byHex.set(key, [label]);
  }
  return [
    {
      type: "swatches",
      title: "Kill colors",
      columns: 1,
      entries: [
        ...[...byHex].map(([hex, labels]) => ({
          label: labels.join(", "),
          hex,
        })),
        { label: ALL_OTHERS_LABEL, hex: settings.defaultColor },
      ],
    },
  ];
}
