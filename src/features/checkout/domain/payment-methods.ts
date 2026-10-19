export const CHECKOUT_PAYMENT_METHODS = ['cash_on_delivery', 'idram', 'arca', 'terminal'] as const;

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

/**
 * Completely removed from storefront lists. Stored orders may still use these ids.
 * Remove an id from this list to show that method again.
 * Idram and Arca stay off this list so the temporary lock can keep them visible.
 */
export const HIDDEN_CHECKOUT_PAYMENT_METHODS = [] as const satisfies readonly CheckoutPaymentMethod[];

/**
 * Temporary storefront lock. Idram and Arca stay visible but cannot be selected.
 * Set to `false` to turn them back on.
 */
export const IDRAM_ARCA_TEMPORARILY_UNAVAILABLE = true;

const TEMPORARILY_UNAVAILABLE_METHODS = new Set<CheckoutPaymentMethod>(['idram', 'arca']);

export function isPaymentMethodTemporarilyUnavailable(method: CheckoutPaymentMethod): boolean {
  return IDRAM_ARCA_TEMPORARILY_UNAVAILABLE && TEMPORARILY_UNAVAILABLE_METHODS.has(method);
}

export function isCheckoutPaymentMethod(value: string): value is CheckoutPaymentMethod {
  return (CHECKOUT_PAYMENT_METHODS as readonly string[]).includes(value);
}

/** True when the method must not appear in storefront lists. */
export function isHiddenCheckoutPaymentMethod(method: CheckoutPaymentMethod): boolean {
  return (HIDDEN_CHECKOUT_PAYMENT_METHODS as readonly CheckoutPaymentMethod[]).includes(method);
}

/** Storefront may select this method. Hidden and locked methods stay valid for stored orders. */
export function isOfferedCheckoutPaymentMethod(method: CheckoutPaymentMethod): boolean {
  return !isHiddenCheckoutPaymentMethod(method) && !isPaymentMethodTemporarilyUnavailable(method);
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
