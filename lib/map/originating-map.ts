const MAP_TYPE_PATH: Record<string, string> = {
  "new-eden": "/",
  anoikis: "/anoikis",
  "abyssal-deadspace": "/abyssal-deadspace",
  tutorials: "/tutorials",
};

let originatingMapType: string | null = null;

export function setOriginatingMap(mapType: string): void {
  originatingMapType = mapType;
}

export function originatingMapPath(): string | null {
  if (originatingMapType == null) return null;
  return MAP_TYPE_PATH[originatingMapType] ?? "/";
}
