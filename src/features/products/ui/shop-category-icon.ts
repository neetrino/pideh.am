import { PIDEH_ASSETS } from '@/features/home/ui/brand-assets';

export type ShopCategoryIcon = {
  src: string;
  width: number;
  height: number;
  /** Show the file as-is instead of recoloring it with a mask. */
  plain?: boolean;
};

const ALL_ICON: ShopCategoryIcon = {
  src: PIDEH_ASSETS.shopCatAll,
  width: 36,
  height: 36,
};

const ICONS = {
  combo: { src: PIDEH_ASSETS.shopCatCombo, width: 48, height: 44 },
  pide: { src: PIDEH_ASSETS.shopCatPide, width: 48, height: 25 },
  snack: { src: PIDEH_ASSETS.shopCatSnack, width: 41, height: 38 },
  sauces: { src: PIDEH_ASSETS.shopCatSauces, width: 41, height: 33 },
  drinks: { src: PIDEH_ASSETS.shopCatDrinks, width: 26, height: 45 },
  shawarma: { src: PIDEH_ASSETS.shopCatShawarma, width: 40, height: 40, plain: true },
} as const satisfies Record<string, ShopCategoryIcon>;

type NamedIconKey = keyof typeof ICONS;

const SLUG_TO_ICON: Record<string, NamedIconKey> = {
  combo: 'combo',
  combos: 'combo',
  kombo: 'combo',
  pide: 'pide',
  snack: 'snack',
  snacks: 'snack',
  appetizer: 'snack',
  sauces: 'sauces',
  sauce: 'sauces',
  drinks: 'drinks',
  drink: 'drinks',
  beverages: 'drinks',
  shawarma: 'shawarma',
  shaurma: 'shawarma',
  shwarma: 'shawarma',
  shawerma: 'shawarma',
};

/** Figma Shop category glyph for a catalog slug, or the All glyph. */
export function shopCategoryIcon(slug: string | 'all'): ShopCategoryIcon {
  if (slug === 'all') {
    return ALL_ICON;
  }

  const normalized = slug.trim().toLowerCase();
  const key = SLUG_TO_ICON[normalized];
  if (key) return ICONS[key];
  if (normalized.includes('shaur') || normalized.includes('shawar') || normalized.includes('shwar')) {
    return ICONS.shawarma;
  }
  return ALL_ICON;
}
