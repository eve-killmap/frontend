export function isApplePlatform(platform: string): boolean {
  return /mac|iphone|ipad|ipod/i.test(platform);
}

export function shortcutLabel(platform: string): string {
  return isApplePlatform(platform) ? "⌘ K" : "Ctrl K";
}

export function currentShortcutLabel(): string {
  return shortcutLabel(
    typeof navigator === "undefined" ? "" : navigator.platform,
  );
}
