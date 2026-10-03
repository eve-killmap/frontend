const CLASS_LABELS: Record<number, string> = {
  1: "C1",
  2: "C2",
  3: "C3",
  4: "C4",
  5: "C5",
  6: "C6",
  12: "Thera",
  13: "C13",
  14: "Sentinel",
  15: "Barbican",
  16: "Vidette",
  17: "Conflux",
  18: "Redoubt",
};

const EFFECT_LABELS: Record<number, string> = {
  1: "Magnetar",
  2: "Black Hole",
  3: "Red Giant",
  4: "Pulsar",
  5: "Wolf-Rayet",
  6: "Cataclysmic Variable",
};

export function wormholeClassLabel(classID: number): string | null {
  return CLASS_LABELS[classID] ?? null;
}

export function displayWormholeClassLabel(
  classID: number,
  systemName: string,
): string | null {
  const label = wormholeClassLabel(classID);
  if (label == null) return null;
  return label.toLowerCase() === systemName.toLowerCase() ? null : label;
}

export function wormholeEffectLabel(effectID: number): string | null {
  return EFFECT_LABELS[effectID] ?? null;
}
