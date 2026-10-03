export function stripFilterParams(search: string): string {
  const params = new URLSearchParams(search);
  if (!params.has("f")) return search;
  params.delete("f");
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}
