export interface CollapseState {
  collapsed: boolean;
  expandedWidth: number | null;
}

export const INITIAL_COLLAPSE: CollapseState = {
  collapsed: false,
  expandedWidth: null,
};

export function decideCollapse(
  prev: CollapseState,
  available: number,
  measured: number,
): CollapseState {
  const expandedWidth = prev.collapsed
    ? (prev.expandedWidth ?? measured)
    : measured;
  return { collapsed: expandedWidth > available, expandedWidth };
}
