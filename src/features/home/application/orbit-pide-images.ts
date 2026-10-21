/** Distinct cutout per orbit slot (pose order: main → top → top-right → bottom-right → bottom). */
export const ORBIT_PIDE_SLUG_BY_SLOT = {
  main: 'pepperoni-pide',
  topCenter: 'shpinat',
  topRight: 'pide-s-bekonom',
  bottomRight: '2-myasa-pide',
  bottomCenter: 'gribnoe-pide',
} as const;

export const ORBIT_PIDE_SLUGS = [
  ORBIT_PIDE_SLUG_BY_SLOT.main,
  ORBIT_PIDE_SLUG_BY_SLOT.topCenter,
  ORBIT_PIDE_SLUG_BY_SLOT.topRight,
  ORBIT_PIDE_SLUG_BY_SLOT.bottomRight,
  ORBIT_PIDE_SLUG_BY_SLOT.bottomCenter,
] as const;

export type OrbitPideImageRow = {
  slug: string;
  url: string;
  title?: string;
};

export type OrbitPidePhoto = {
  url: string;
  title: string;
  slug: string;
};

function photoTitle(row: OrbitPideImageRow): string {
  const title = row.title?.trim();
  return title && title.length > 0 ? title : row.slug;
}

/**
 * Prefers the named pide varieties, then appends every other unique pide
 * photo so the ring can cycle the full catalog.
 */
export function resolveOrbitPidePhotos(rows: readonly OrbitPideImageRow[]): OrbitPidePhoto[] {
  const bySlug = new Map<string, OrbitPideImageRow>();
  for (const row of rows) {
    if (!bySlug.has(row.slug)) {
      bySlug.set(row.slug, row);
    }
  }

  const used = new Set<string>();
  const photos: OrbitPidePhoto[] = [];

  const pushUnique = (row: OrbitPideImageRow): void => {
    if (used.has(row.url)) {
      return;
    }
    photos.push({ url: row.url, title: photoTitle(row), slug: row.slug });
    used.add(row.url);
  };

  for (const slug of ORBIT_PIDE_SLUGS) {
    const row = bySlug.get(slug);
    if (row) {
      pushUnique(row);
    }
  }

  for (const row of rows) {
    pushUnique(row);
  }

  return photos;
}

export function resolveOrbitPideImageUrls(rows: readonly OrbitPideImageRow[]): string[] {
  return resolveOrbitPidePhotos(rows).map((photo) => photo.url);
}
