import { describe, expect, it } from 'vitest';

import { CANONICAL_TABLE_COUNT, CANONICAL_TABLES } from '@/db/schema/tables';

describe('canonical table inventory', () => {
  it('contains exactly 39 unique application tables', () => {
    expect(CANONICAL_TABLE_COUNT).toBe(39);
    expect(new Set(CANONICAL_TABLES).size).toBe(39);
    expect([...CANONICAL_TABLES]).toEqual([
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
    ]);
  });
});
