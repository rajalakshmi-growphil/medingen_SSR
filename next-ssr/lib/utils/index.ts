export function nameToSlug(name: string, id: string | number | null = null): string {
  const base = name
    ? name
        .toLowerCase()
        .replace(/&/g, "and")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
    : "";
  return id ? `${base}-${id}` : base;
}

export function slugToName(slug: string): string | null {
  if (!slug) return null;
  return slug
    .replace(/-\d+$/, "")
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
