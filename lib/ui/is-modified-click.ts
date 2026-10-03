export interface ClickLike {
  button?: number;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}

export function isModifiedClick(e: ClickLike): boolean {
  return (
    (e.button ?? 0) !== 0 ||
    !!e.ctrlKey ||
    !!e.metaKey ||
    !!e.shiftKey ||
    !!e.altKey
  );
}
