export function slugify(name: string): string {
  let s = name.normalize("NFKD");
  s = s.toLowerCase();
  s = s.replace(/[\s_]+/g, "-");
  s = s.replace(/[^a-z0-9-]+/g, "");
  s = s.replace(/-{2,}/g, "-");
  s = s.replace(/^-+|-+$/g, "");

  if (!s) {
    throw new Error(`Unable to slugify system name: ${name}`);
  }

  return s;
}
