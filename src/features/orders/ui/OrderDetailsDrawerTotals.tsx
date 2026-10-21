import type { AdminOrderDetailView } from '@/features/orders/application/order-detail-view';
import { formatOrderDrawerMoney } from '@/features/orders/ui/order-drawer-format';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type OrderDetailsDrawerTotalsProps = {
  detail: AdminOrderDetailView;
  copy: Dictionary['admin'];
  variant?: 'full' | 'group';
};

export function OrderDetailsDrawerTotals({
  detail,
  copy,
  variant = 'full',
}: OrderDetailsDrawerTotalsProps) {
  const d = copy.orders.drawer;
  const isGroup = variant === 'group';

  const shippingLabel = detail.isPickup
    ? d.freeStorePickup
    : formatOrderDrawerMoney(detail.deliveryAmount, detail.baseCurrency);

  const couponRowLabel = detail.couponCode
    ? d.couponDiscountWithCode.replace('{code}', detail.couponCode)
    : d.couponDiscount;

  const discountLabel = `−${formatOrderDrawerMoney(detail.discountAmount, detail.baseCurrency)}`;

  return (
    <div className={isGroup ? 'px-1 py-2' : 'rounded-2xl border border-gray-200 px-5 py-4'}>
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">{d.subtotal}</span>
          <span className="font-medium text-gray-900">
            {formatOrderDrawerMoney(detail.subtotalAmount, detail.baseCurrency)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">{d.delivery}</span>
          <span className="font-medium text-gray-900">{shippingLabel}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-600">{d.method}</span>
          <span className="font-medium text-gray-900">{detail.paymentMethod}</span>
        </div>

        {!isGroup && detail.discountAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">{couponRowLabel}</span>
            <span className="font-medium text-green-700">{discountLabel}</span>
          </div>
        ) : null}

        {!isGroup && detail.bonusRedeemedAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">{d.bonusRedeemed}</span>
            <span className="font-medium text-green-700">
              −{formatOrderDrawerMoney(detail.bonusRedeemedAmount, detail.baseCurrency)}
            </span>
          </div>
        ) : null}

        {!isGroup && detail.giftCardAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">{d.giftCard}</span>
            <span className="font-medium text-green-700">
              −{formatOrderDrawerMoney(detail.giftCardAmount, detail.baseCurrency)}
            </span>
          </div>
        ) : null}

        {isGroup ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">{d.receivedBonus}</span>
            <span className="font-medium text-emerald-700">
              +{formatOrderDrawerMoney(detail.bonusEarnedAmount, detail.baseCurrency)}
            </span>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-3">
          <span className="text-base font-semibold text-gray-900">{d.grandTotal}</span>
          <span className="text-base font-semibold text-gray-900">
            {formatOrderDrawerMoney(detail.totalAmount, detail.baseCurrency)}
          </span>
        </div>

        {!isGroup && detail.bonusEarnedAmount > 0 ? (
          <div className="flex items-center justify-between gap-4">
            <span className="text-gray-600">{d.bonusEarned}</span>
            <span className="font-medium text-emerald-700">
              +{formatOrderDrawerMoney(detail.bonusEarnedAmount, detail.baseCurrency)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
