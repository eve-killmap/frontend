const MAP_TITLES: Record<string, string> = {
  "new-eden": "New Eden",
  anoikis: "Anoikis",
  "abyssal-deadspace": "Abyssal Deadspace",
  tutorials: "Tutorials",
};

export function mapTitle(mapType: string): string {
  return MAP_TITLES[mapType] ?? MAP_TITLES["new-eden"];
}

export function mapScreenshotTitle(mapType: string): string {
  return mapType === "tutorials" ? "Tutorial Systems" : mapTitle(mapType);
}
