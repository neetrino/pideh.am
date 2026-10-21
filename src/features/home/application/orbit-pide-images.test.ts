import { describe, expect, it } from 'vitest';

import {
  ORBIT_PIDE_SLUG_BY_SLOT,
  ORBIT_PIDE_SLUGS,
  resolveOrbitPideImageUrls,
  resolveOrbitPidePhotos,
} from '@/features/home/application/orbit-pide-images';

describe('resolveOrbitPideImageUrls', () => {
  it('returns preferred slugs in slot order', () => {
    const rows = ORBIT_PIDE_SLUGS.map((slug) => ({ slug, url: `https://cdn/${slug}.webp` }));

    expect(resolveOrbitPideImageUrls(rows)).toEqual(
      ORBIT_PIDE_SLUGS.map((slug) => `https://cdn/${slug}.webp`),
    );
  });

  it('keeps leftover unique photos after the preferred five', () => {
    expect(
      resolveOrbitPideImageUrls([
        { slug: 'pepperoni-pide', url: 'https://cdn/pepperoni.webp' },
        { slug: 'extra-pide', url: 'https://cdn/extra.webp' },
        { slug: 'shpinat', url: 'https://cdn/spinach.webp' },
      ]),
    ).toEqual([
      'https://cdn/pepperoni.webp',
      'https://cdn/spinach.webp',
      'https://cdn/extra.webp',
    ]);
  });

  it('fills missing preferred slugs from other unique photos', () => {
    expect(
      resolveOrbitPideImageUrls([
        { slug: 'pepperoni-pide', url: 'https://cdn/pepperoni.webp' },
        { slug: 'caucasus-cheese', url: 'https://cdn/caucasus.webp' },
        { slug: 'classic-chees', url: 'https://cdn/classic.webp' },
      ]),
    ).toEqual([
      'https://cdn/pepperoni.webp',
      'https://cdn/caucasus.webp',
      'https://cdn/classic.webp',
    ]);
  });

  it('does not repeat the same url', () => {
    expect(
      resolveOrbitPideImageUrls([
        { slug: 'pepperoni-pide', url: 'https://cdn/same.webp' },
        { slug: 'shpinat', url: 'https://cdn/same.webp' },
        { slug: 'gribnoe-pide', url: 'https://cdn/mushroom.webp' },
      ]),
    ).toEqual(['https://cdn/same.webp', 'https://cdn/mushroom.webp']);
  });

  it('assigns a unique slug to each named orbit slot', () => {
    const slugs = Object.values(ORBIT_PIDE_SLUG_BY_SLOT);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(ORBIT_PIDE_SLUGS).toEqual(slugs);
  });
});

describe('resolveOrbitPidePhotos', () => {
  it('keeps the product title with each unique photo', () => {
    expect(
      resolveOrbitPidePhotos([
        { slug: 'pepperoni-pide', url: 'https://cdn/pepperoni.webp', title: 'Պեպպերոնի' },
        { slug: 'shpinat', url: 'https://cdn/spinach.webp', title: 'Սպանախ' },
      ]),
    ).toEqual([
      { url: 'https://cdn/pepperoni.webp', title: 'Պեպպերոնի', slug: 'pepperoni-pide' },
      { url: 'https://cdn/spinach.webp', title: 'Սպանախ', slug: 'shpinat' },
    ]);
  });
});
