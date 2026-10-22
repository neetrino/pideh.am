import type { CatalogProduct } from '@/features/products/types';

export type CatalogSection = {
  slug: string;
  title: string;
  products: CatalogProduct[];
  /** Total matches for this block. */
  total: number;
};
