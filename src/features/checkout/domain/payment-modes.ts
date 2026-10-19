import {
  isHiddenCheckoutPaymentMethod,
  isOfferedCheckoutPaymentMethod,
} from '@/features/checkout/domain/payment-methods';

export const CHECKOUT_ONLINE_PROVIDERS = ['idram', 'arca'] as const;

export type CheckoutOnlineProvider = (typeof CHECKOUT_ONLINE_PROVIDERS)[number];

/** Online providers still drawn on split group-order pay, including locked ones. */
export function visibleCheckoutOnlineProviders(): CheckoutOnlineProvider[] {
  return CHECKOUT_ONLINE_PROVIDERS.filter((provider) => !isHiddenCheckoutPaymentMethod(provider));
}

/** Online providers the customer can actually select. */
export function offeredCheckoutOnlineProviders(): CheckoutOnlineProvider[] {
  return CHECKOUT_ONLINE_PROVIDERS.filter(isOfferedCheckoutPaymentMethod);
}
