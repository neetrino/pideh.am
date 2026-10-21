'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';

import { SideSheet } from '@/components/ui/SideSheet';
import { removeItem, updateQuantity } from '@/features/cart/cart';
import type { CartDrawerBundle, CartDrawerView } from '@/features/cart/get-cart-drawer-view';
import {
  loadCartDrawerViewAction,
  setCartOrderModeAction,
} from '@/features/cart/load-cart-drawer-view-action';
import { CartDrawerEmpty } from '@/features/cart/ui/CartDrawerEmpty';
import { CartOrderModeSwitch } from '@/features/cart/ui/CartOrderModeSwitch';
import { CartDrawerItems } from '@/features/cart/ui/CartDrawerItems';
import { CartDrawerTotals } from '@/features/cart/ui/CartDrawerTotals';
import { useCartBadge } from '@/features/cart/ui/cart-badge-count';
import { CART_TARGET_ATTR } from '@/features/cart/ui/fly-to-cart';
import {
  removeGroupOrderItemAction,
  updateGroupOrderItemQuantityAction,
} from '@/features/group-orders/actions';
import { alertIfSpendLimitExceeded } from '@/features/group-orders/ui/alert-spend-limit-exceeded';
import type { Dictionary } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/lib/i18n/config';
import type { Currency } from '@/lib/money/currency';

type CartDrawerTriggerArgs = {
  open: boolean;
  badgeCount: number;
  label: string;
  openDrawer: () => void;
  prefetchDrawerView: () => void;
};

type CartDrawerProps = {
  locale: Locale;
  currency: Currency;
  dictionary: Dictionary;
  itemCount: number;
  renderTrigger?: (args: CartDrawerTriggerArgs) => React.ReactNode;
};

function patchBundleQuantity(
  bundle: CartDrawerBundle | null,
  source: CartDrawerView['source'],
  itemId: string,
  quantity: number,
): CartDrawerBundle | null {
  if (!bundle) return bundle;
  const current = source === 'group' ? bundle.group : bundle.personal;
  if (!current) return bundle;
  const items = current.items.flatMap((item) => {
    if (item.id !== itemId) return [item];
    if (quantity < 1) return [];
    return [{ ...item, quantity }];
  });
  const nextView: CartDrawerView = {
    ...current,
    items,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
  return source === 'group' ? { ...bundle, group: nextView } : { ...bundle, personal: nextView };
}

export function CartDrawer({
  locale,
  currency,
  dictionary,
  itemCount,
  renderTrigger,
}: CartDrawerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [bundle, setBundle] = useState<CartDrawerBundle | null>(null);
  const [orderMode, setOrderMode] = useState<'group' | 'personal'>('group');
  const [loadingView, setLoadingView] = useState(false);
  const [pending, startTransition] = useTransition();
  const quantityRequestRef = useRef(0);
  const { count: cartCount, adding: cartAdding } = useCartBadge(itemCount);
  const syncedItemCountRef = useRef(cartCount);
  const labels = dictionary.cartDrawer;
  const view =
    bundle == null
      ? null
      : orderMode === 'group' && bundle.group
        ? bundle.group
        : bundle.personal;
  const isGroupSource = view?.source === 'group';
  const badgeCount = open && view ? view.itemCount : cartCount;
  const hasItems = Boolean(view && view.items.length > 0);
  const displayCurrency = view?.currency ?? currency;

  function applyBundle(next: CartDrawerBundle): void {
    setBundle(next);
    setOrderMode(next.group ? next.orderMode : 'personal');
    syncedItemCountRef.current = (next.group && next.orderMode === 'group'
      ? next.group
      : next.personal
    ).itemCount;
  }

  function loadView(showPlaceholder: boolean): void {
    if (showPlaceholder) {
      setLoadingView(true);
    }
    startTransition(async () => {
      applyBundle(await loadCartDrawerViewAction(locale, currency));
      setLoadingView(false);
    });
  }

  function chooseOrderMode(mode: 'group' | 'personal'): void {
    setOrderMode(mode);
    startTransition(async () => {
      await setCartOrderModeAction(mode);
      const next = await loadCartDrawerViewAction(locale, currency);
      setBundle(next);
      setOrderMode(next.group ? mode : 'personal');
      const selected = mode === 'group' && next.group ? next.group : next.personal;
      syncedItemCountRef.current = selected.itemCount;
      router.refresh();
    });
  }

  useEffect(() => {
    if (!open) {
      syncedItemCountRef.current = cartCount;
      return;
    }
    // While an add is in flight the optimistic count is ahead of the database,
    // so the reload waits for the write to land.
    if (cartAdding || syncedItemCountRef.current === cartCount) {
      return;
    }
    syncedItemCountRef.current = cartCount;
    loadView(false);
    // Reload only when the header badge count changes while the drawer is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: cartCount/open drive sync
  }, [cartCount, cartAdding, open, locale, currency]);

  function prefetchDrawerView(): void {
    if (view || loadingView || open) {
      return;
    }
    loadView(true);
  }

  function openDrawer(): void {
    setOpen(true);
    loadView(!view);
  }

  function closeDrawer(): void {
    setOpen(false);
  }

  function changeQuantity(itemId: string, quantity: number): void {
    const nextQty = Math.max(0, quantity);
    const source = view?.source;
    const inviteToken = view?.groupInviteToken ?? null;
    if (!source) return;

    setBundle((current) => patchBundleQuantity(current, source, itemId, nextQty));
    const requestId = ++quantityRequestRef.current;
    window.setTimeout(() => {
      void (async () => {
        try {
          if (source === 'group' && inviteToken) {
            const result = await updateGroupOrderItemQuantityAction({
              inviteToken,
              itemId,
              quantity: nextQty,
            });
            if (!result.ok) {
              if (quantityRequestRef.current !== requestId) return;
              alertIfSpendLimitExceeded(locale, result);
              applyBundle(await loadCartDrawerViewAction(locale, currency));
              return;
            }
          } else {
            await updateQuantity(itemId, nextQty);
          }
          if (quantityRequestRef.current !== requestId) return;
          applyBundle(await loadCartDrawerViewAction(locale, currency));
        } catch {
          if (quantityRequestRef.current !== requestId) return;
          applyBundle(await loadCartDrawerViewAction(locale, currency));
        }
      })();
    }, 0);
  }

  function removeCartItem(itemId: string): void {
    startTransition(async () => {
      if (view?.source === 'group' && view.groupInviteToken) {
        await removeGroupOrderItemAction({
          inviteToken: view.groupInviteToken,
          itemId,
        });
      } else {
        await removeItem(itemId);
      }
      applyBundle(await loadCartDrawerViewAction(locale, currency));
    });
  }

  return (
    <>
      <SideSheet
        open={open}
        onClose={closeDrawer}
        ariaLabel={isGroupSource ? labels.groupOrder : labels.title}
        panelClassName="w-[87%] max-w-[420px]"
        panelInnerClassName="rounded-l-[28px] bg-[#fff8e7]"
        closeClassName="bg-[#ff6b00] hover:bg-[#e85f00]"
        zIndexClassName="z-[200]"
        backdropBlur
      >
        <div className="border-b border-[#ff6b00]/15 px-6 py-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-3xl leading-[0.9] text-[#1e1e1e] uppercase">
              {labels.title}
            </h2>
            {hasItems ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#ff6b00] text-sm font-bold text-white">
                {badgeCount}
              </span>
            ) : null}
          </div>
          {bundle?.group ? (
            <CartOrderModeSwitch
              mode={orderMode === 'group' ? 'group' : 'personal'}
              groupLabel={labels.groupOrder}
              personalLabel={labels.regularOrder}
              hint={labels.orderModeHint}
              disabled={pending}
              onChange={chooseOrderMode}
            />
          ) : null}
        </div>

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4"
        >
          {loadingView && !view ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-[22px] bg-white/80" />
              <div className="h-24 animate-pulse rounded-[22px] bg-white/80" />
            </div>
          ) : !view || view.items.length === 0 ? (
            <CartDrawerEmpty
              locale={locale}
              empty={labels.empty}
              emptyDescription={labels.emptyDescription}
              emptyCta={labels.emptyCta}
              onContinue={closeDrawer}
            />
          ) : (
            <CartDrawerItems
              items={view.items}
              removeLabel={labels.removeItem}
              decreaseLabel={labels.decreaseQuantity}
              increaseLabel={labels.increaseQuantity}
              pending={false}
              onQuantity={changeQuantity}
              onRemove={removeCartItem}
              onOpenProduct={closeDrawer}
            />
          )}
        </div>

        <CartDrawerTotals
          currency={displayCurrency}
          totalLabel={labels.total}
          checkoutLabel={isGroupSource ? labels.continueGroupOrder : labels.checkout}
          checkoutHref={view?.checkoutHref ?? `/${locale}/checkout`}
          totalAmount={view?.totalAmount ?? 0}
          earnPoints={view?.earnPoints ?? 0}
          earnLabel={labels.futureBonus}
          hasItems={hasItems}
          onCheckout={closeDrawer}
        />
      </SideSheet>

      {renderTrigger ? (
        renderTrigger({
          open,
          badgeCount,
          label: dictionary.nav.cart,
          openDrawer,
          prefetchDrawerView,
        })
      ) : (
        <button
          type="button"
          onClick={openDrawer}
          onPointerEnter={prefetchDrawerView}
          onFocus={prefetchDrawerView}
          className="inline-flex h-11 items-center gap-1 rounded-lg px-1 text-gray-700 transition-colors hover:text-gray-900"
          aria-label={dictionary.nav.cart}
          aria-expanded={open}
        >
          <span
            {...{ [CART_TARGET_ATTR]: '' }}
            className="relative inline-flex h-11 w-11 items-center justify-center"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
            {badgeCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff6b00] px-1 text-[10px] font-semibold text-white">
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            ) : null}
          </span>
        </button>
      )}
    </>
  );
}
