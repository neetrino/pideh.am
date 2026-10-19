import { isOfferedCheckoutPaymentMethod } from '@/features/checkout/domain/payment-methods';

export const CHECKOUT_ONLINE_PROVIDERS = ['idram', 'arca'] as const;

export type CheckoutOnlineProvider = (typeof CHECKOUT_ONLINE_PROVIDERS)[number];

/** Online providers currently shown for split group-order payments. */
export function offeredCheckoutOnlineProviders(): CheckoutOnlineProvider[] {
  return CHECKOUT_ONLINE_PROVIDERS.filter(isOfferedCheckoutPaymentMethod);
}
