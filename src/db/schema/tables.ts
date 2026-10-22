/**
 * Canonical application tables from docs/03-DATA-MODEL.md.
 * Infrastructure table `app_meta` is intentionally excluded.
 */
export const CANONICAL_TABLES = [
  'users',
  'sessions',
  'addresses',
  'media_assets',
  'store_settings',
  'products',
  'categories',
  'product_categories',
  'product_modifiers',
  'product_modifier_links',
  'stock_movements',
  'bonus_transactions',
  'gift_cards',
  'gift_card_transactions',
  'hero_slides',
  'store_popups',
  'blog_posts',
  'carts',
  'cart_items',
  'cart_item_modifiers',
  'wishlist_items',
  'promotions',
  'promotion_users',
  'delivery_rules',
  'orders',
  'order_items',
  'order_item_modifiers',
  'order_events',
  'payments',
  'reviews',
  'contact_messages',
  'audit_logs',
  'outbox_events',
  'group_orders',
  'group_order_participants',
  'group_order_items',
  'group_order_item_modifiers',
  'group_order_events',
  'admin_push_subscriptions',
] as const;

export type CanonicalTable = (typeof CANONICAL_TABLES)[number];

export const CANONICAL_TABLE_COUNT = CANONICAL_TABLES.length;
