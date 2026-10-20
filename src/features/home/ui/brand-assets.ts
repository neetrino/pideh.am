import { pidehRasterUrl } from '@/lib/media/r2-public-asset-url';

/** Static brand assets exported from Figma Pideh-Dev (node 1:76). */
export const PIDEH_ASSETS = {
  /** 8× master of the navbar wordmark, so retina layouts downscale instead of stretching the small source. */
  logo: '/brand/pideh/logo.png',
  foodPide: pidehRasterUrl('food-pide'),
  ctaPide: pidehRasterUrl('cta-pide'),
  ctaDotA: '/brand/pideh/cta-dot-a.svg',
  ctaDotB: '/brand/pideh/cta-dot-b.svg',
  ctaDotC: '/brand/pideh/cta-dot-c.svg',
  ctaDotD: '/brand/pideh/cta-dot-d.svg',
  ctaDotE: '/brand/pideh/cta-dot-e.svg',
  ctaDotF: '/brand/pideh/cta-dot-f.svg',
  /** Figma desktop hero pide video still (436:582). */
  heroPide: '/brand/pideh/hero-pide.png',
  /** Compact JPEG still for video poster / reduced-motion fallback. */
  heroVideoPoster: '/brand/pideh/hero-food-poster.jpg',
  /** Desktop hero loop. Missing file → static hero pide. */
  heroVideoMp4: '/brand/pideh/hero-food.mp4',
  heroVideoWebm: '/brand/pideh/hero-pide.webm',
  categoryPide: pidehRasterUrl('category-pide'),
  categoryArc: '/brand/pideh/category-arc.svg',
  waveYellow: '/brand/pideh/wave-yellow.svg',
  waveOrange: '/brand/pideh/wave-orange.svg',
  /** Figma Rectangle 6 (1:81) — CTA transition, same drip geometry as yellow waves. */
  waveOrangeCta: '/brand/pideh/wave-orange-cta.svg',
  /** Figma Rectangle 7 (1:202) — yellow footer band, asset 1510×540 with frame overflow. */
  waveFooter: '/brand/pideh/wave-footer.svg',
  featureWave: '/brand/pideh/feature-wave.svg',
  featureDelivery: pidehRasterUrl('feature-delivery'),
  featureQuality: pidehRasterUrl('feature-quality'),
  featureSupport: pidehRasterUrl('feature-support'),
  featurePrep: pidehRasterUrl('feature-prep'),
  arrowLeft: '/brand/pideh/arrow-left.svg',
  arrowRight: '/brand/pideh/arrow-right.svg',
  iconArrow: '/brand/pideh/icon-arrow.svg',
  socialInstagram: '/brand/pideh/social-1.svg',
  socialFacebook: '/brand/pideh/social-2.svg',
  socialTelegram: '/brand/pideh/social-3.svg',
  socialWhatsapp: '/brand/pideh/social-4.svg',
  socialViber: '/brand/pideh/social-5.svg',
  /** Figma Shop page (154:453) category + chrome icons. */
  shopCatAll: '/brand/pideh/shop-cat-all.svg',
  shopCatCombo: '/brand/pideh/shop-cat-combo.svg',
  shopCatPide: '/brand/pideh/shop-cat-pide.svg',
  shopCatSnack: '/brand/pideh/shop-cat-snack.svg',
  shopCatSauces: '/brand/pideh/shop-cat-sauces.svg',
  shopCatDrinks: '/brand/pideh/shop-cat-drinks.svg',
  shopCatShawarma: '/brand/pideh/shop-cat-shawarma.png',
  shopFilter: '/brand/pideh/shop-filter.svg',
  shopChevron: '/brand/pideh/shop-chevron.svg',
  shopHeart: '/brand/pideh/shop-heart.svg',
  /** Figma ProductPage (180:882) chrome icons. */
  pdpList: '/brand/pideh/pdp-list.svg',
  pdpPlus: '/brand/pideh/pdp-plus.svg',
  pdpRemove: '/brand/pideh/pdp-remove.svg',
  pdpTrash: '/brand/pideh/pdp-trash.svg',
  pdpQtyMinus: '/brand/pideh/pdp-qty-minus.svg',
  pdpQtyPlus: '/brand/pideh/pdp-qty-plus.svg',
  pdpCart: '/brand/pideh/pdp-cart.svg',
  pdpHeart: '/brand/pideh/pdp-heart.svg',
  pdpRuler: '/brand/pideh/pdp-ruler.svg',
  pdpLayers: '/brand/pideh/pdp-layers.svg',
  pdpEdit: '/brand/pideh/pdp-edit.svg',
} as const;
