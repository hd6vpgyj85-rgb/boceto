function stripDiacritics(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function slugify(text: string): string {
  return stripDiacritics(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(name: string, existingIds: Set<string>): string {
  const base = slugify(name) || "producto";
  if (!existingIds.has(base)) return base;

  let n = 2;
  while (existingIds.has(`${base}-${n}`)) {
    n += 1;
  }
  return `${base}-${n}`;
}

export function normalizeSearch(text: string): string {
  return stripDiacritics(text)
    .toLowerCase()
    .replace(/[\s-]+/g, "");
}
