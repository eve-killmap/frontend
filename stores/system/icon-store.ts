import { sortObjectIDs } from "./system-object-name-store";

type IconItem = {
  iconID: number;
  position: [number, number, number];
};

const icons = new Map<number, IconItem>();

export function addIcon(id: number, { iconID, position }: IconItem) {
  icons.set(id, { iconID, position });
}

export function clearIcons() {
  icons.clear();
}

export interface RegisteredIcon {
  id: number;
  iconID: number;
  position: [number, number, number];
}

export function getAllIcons(): RegisteredIcon[] {
  const out: RegisteredIcon[] = [];
  for (const [id, it] of icons) out.push({ id, ...it });
  return out;
}

export function getIconsByIDs(ids: readonly number[]): RegisteredIcon[] {
  const out: RegisteredIcon[] = [];
  for (const id of sortObjectIDs(ids)) {
    const it = icons.get(id);
    if (it) out.push({ id, ...it });
  }
  return out;
}
