export const CHECKOUT_PAYMENT_METHODS = ['cash_on_delivery', 'idram', 'arca', 'terminal'] as const;

export type CheckoutPaymentMethod = (typeof CHECKOUT_PAYMENT_METHODS)[number];

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
