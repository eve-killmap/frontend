export interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export function isPaletteHotkey(e: KeyLike): boolean {
  return (
    (!!e.ctrlKey || !!e.metaKey) && !e.altKey && e.key.toLowerCase() === "k"
  );
}
