import { notFound } from 'next/navigation';

import { AppLink } from '@/components/ui/AppLink';
import { getCartWithItems, removeItem, updateQuantity } from '@/features/cart/cart';
import { cartLineUnitAmount } from '@/features/cart/domain/line-price';
import { resolveProductPrices } from '@/features/promotions/application/resolve-product-prices';
import { isLocale } from '@/lib/i18n/config';

type CartPageProps = { params: Promise<{ locale: string }> };

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const { items } = await getCartWithItems();
  const prices = await resolveProductPrices(
    items.map(({ product }) => ({
      id: product.id,
      priceAmount: product.priceAmount,
      compareAtAmount: product.compareAtAmount,
    })),
  );

  const total = items.reduce((sum, { item, product, modifiers }) => {
    const base = prices.get(product.id)?.unitAmount ?? product.priceAmount;
    return sum + item.quantity * cartLineUnitAmount(base, modifiers);
  }, 0);

  return (
    <section className="flex w-full max-w-2xl min-w-0 flex-col gap-4">
      <h1 className="text-[clamp(1.75rem,5vw,1.875rem)] font-semibold">Cart</h1>
      {items.map(({ item, product, modifiers }) => {
        const base = prices.get(product.id)?.unitAmount ?? product.priceAmount;
        const unit = cartLineUnitAmount(base, modifiers);
        const additions = modifiers.filter((row) => row.kind === 'ADDITION');
        const exceptions = modifiers.filter((row) => row.kind === 'EXCEPTION');
        return (
          <div
            className="flex min-w-0 flex-col gap-3 border p-3 sm:flex-row sm:items-center sm:justify-between"
            key={item.id}
          >
            <div className="min-w-0">
              <p className="break-words">{product.translations[locale]?.title ?? product.sku}</p>
              {additions.length > 0 ? (
                <p className="text-xs text-gray-600">
                  + {additions.map((row) => row.name).join(', ')}
                </p>
              ) : null}
              {exceptions.length > 0 ? (
                <p className="text-xs text-gray-600">
                  − {exceptions.map((row) => row.name).join(', ')}
                </p>
              ) : null}
              <p className="text-sm">
                {unit} ֏ × {item.quantity}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form
                action={async () => {
                  'use server';
                  await updateQuantity(item.id, item.quantity - 1);
                }}
              >
                <button className="border px-2">−</button>
              </form>
              <form
                action={async () => {
                  'use server';
                  await updateQuantity(item.id, item.quantity + 1);
                }}
              >
                <button className="border px-2">+</button>
              </form>
              <form
                action={async () => {
                  'use server';
                  await removeItem(item.id);
                }}
              >
                <button className="text-red-700">Remove</button>
              </form>
            </div>
          </div>
        );
      })}
      <p className="font-medium">Total: {total} ֏</p>
      {items.length ? (
        <AppLink
          href={`/${locale}/checkout`}
          prefetchPolicy="intent"
          className="min-h-11 bg-[var(--accent)] px-4 py-2 text-center text-[var(--accent-foreground)]"
        >
          Checkout
        </AppLink>
      ) : (
        <p>Your cart is empty.</p>
      )}
    </section>
  );
}
