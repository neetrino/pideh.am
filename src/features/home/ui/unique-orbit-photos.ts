/**
 * Unique photo URLs for the desktop category ring — never repeats a file.
 */
export function uniqueOrbitPhotos(urls: readonly (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const url of urls) {
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    unique.push(url);
  }

  return unique;
}

export type OrbitPhotoItem = {
  imageUrl: string;
  title: string;
  href?: string;
};

/** Unique orbit cutouts, first title wins for a repeated file. */
export function uniqueOrbitItems(items: readonly OrbitPhotoItem[]): OrbitPhotoItem[] {
  const seen = new Set<string>();
  const unique: OrbitPhotoItem[] = [];

  for (const item of items) {
    if (!item.imageUrl || seen.has(item.imageUrl)) {
      continue;
    }
    seen.add(item.imageUrl);
    unique.push(item);
  }

  return unique;
}
