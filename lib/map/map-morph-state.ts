export const mapMorphState = {
  t: 0,
  target: 0,
  morphing: false,
};

export function initMapMorph(show3D: boolean): void {
  const v = show3D ? 1 : 0;
  mapMorphState.t = v;
  mapMorphState.target = v;
  mapMorphState.morphing = false;
}
