const AU = 149_597_870_700;

export function formatDistance(meters: number): string {
  if (meters < 0.1 * AU) {
    return `${Math.round(meters / 1000).toLocaleString()} km`;
  }
  return `${(meters / AU).toFixed(2)} AU`;
}
