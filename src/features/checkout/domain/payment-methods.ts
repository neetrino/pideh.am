export const CHECKOUT_PAYMENT_METHODS = ['cash_on_delivery', 'idram', 'arca', 'terminal'] as const;

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

/**
 * Kept in checkout, gift cards, and group-order pay, but not offered yet.
 * Remove an id from this list to show that method again.
 */
export const HIDDEN_CHECKOUT_PAYMENT_METHODS = ['idram', 'arca'] as const satisfies readonly CheckoutPaymentMethod[];

export function isCheckoutPaymentMethod(value: string): value is CheckoutPaymentMethod {
  return (CHECKOUT_PAYMENT_METHODS as readonly string[]).includes(value);
}

/** Storefront may select this method. Hidden methods stay valid for stored orders. */
export function isOfferedCheckoutPaymentMethod(method: CheckoutPaymentMethod): boolean {
  return !(HIDDEN_CHECKOUT_PAYMENT_METHODS as readonly CheckoutPaymentMethod[]).includes(method);
}

/** Cash on delivery is only for solo checkout, not group-order organizer pay. */
export function isCashOnDeliveryAllowedForCheckout(isGroupOrderCheckout: boolean): boolean {
  return !isGroupOrderCheckout;
}

/** Maps checkout UI payment choice to payments.provider / payments.method. */
export function toPaymentRecord(method: CheckoutPaymentMethod): {
  provider: string;
  method: string;
} {
  switch (method) {
    case 'idram':
      return { provider: 'idram', method: 'IDRAM' };
    case 'arca':
      return { provider: 'arca', method: 'ARCA' };
    case 'cash_on_delivery':
      return { provider: 'cod', method: 'COD' };
    case 'terminal':
      return { provider: 'terminal', method: 'TERMINAL' };
  }
}
