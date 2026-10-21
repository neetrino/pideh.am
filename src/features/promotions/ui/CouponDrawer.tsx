'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { MultiSelectDropdown } from '@/components/ui/MultiSelectDropdown';
import { SelectDropdown } from '@/components/ui/SelectDropdown';
import { SideSheet } from '@/components/ui/SideSheet';
import { ADMIN_INPUT, ADMIN_LABEL } from '@/features/admin/ui/admin-form-classes';
import {
  createPromotionAction,
  updatePromotionAction,
} from '@/features/promotions/application/upsert-promotion';
import type {
  AdminPromotionListItem,
  CouponUserOption,
} from '@/features/promotions/application/queries';
import type { DiscountType } from '@/features/promotions/domain/promotion-rules';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type CouponDrawerCoupon = Pick<
  AdminPromotionListItem,
  | 'id'
  | 'code'
  | 'discountType'
  | 'discountValue'
  | 'totalUsageLimit'
  | 'endsAt'
  | 'isActive'
  | 'userIds'
>;

type CouponDrawerCopy = {
  drawer: Dictionary['admin']['coupons']['drawer'];
  common: Dictionary['admin']['common'];
};

type CouponDrawerProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  coupon?: CouponDrawerCoupon | null;
  userOptions: CouponUserOption[];
  copy: CouponDrawerCopy;
};

function toDateTimeLocal(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

export function CouponDrawer({
  locale,
  open,
  onClose,
  coupon = null,
  userOptions,
  copy,
}: CouponDrawerProps) {
  const router = useRouter();
  const isEdit = coupon != null;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('PERCENTAGE');
  const [value, setValue] = useState('10');
  const [quantity, setQuantity] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;

    if (coupon) {
      setName(coupon.code ?? '');
      setCode(coupon.code ?? '');
      setDiscountType(coupon.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE');
      setValue(String(coupon.discountValue));
      setQuantity(coupon.totalUsageLimit != null ? String(coupon.totalUsageLimit) : '');
      setExpiresAt(toDateTimeLocal(coupon.endsAt));
      setSelectedUserIds(coupon.userIds);
      setError(null);
    } else {
      setName('');
      setCode('');
      setDiscountType('PERCENTAGE');
      setValue('10');
      setQuantity('1');
      setExpiresAt('');
      setSelectedUserIds([]);
      setError(null);
    }
  }, [open, coupon]);

  return (
    <SideSheet
      open={open}
      onClose={onClose}
      ariaLabel={isEdit ? copy.drawer.editAria : copy.drawer.newAria}
      variant="admin"
    >
      <div className="shrink-0 border-b-2 border-[#1e1e1e]/10 px-5 py-4 sm:px-6">
        <h2 className="font-display text-2xl leading-[0.95] text-[#1e1e1e] uppercase sm:text-3xl">
          {isEdit ? copy.drawer.editTitle : copy.drawer.newTitle}
        </h2>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          const nextCode = (code.trim() || name.trim()).toUpperCase();
          if (!nextCode) {
            setError(copy.drawer.codeRequired);
            return;
          }

          const payload = {
            kind: 'COUPON' as const,
            code: nextCode,
            productId: null,
            categoryId: null,
            discountType,
            discountValue: Number(value),
            maxDiscountAmount: null,
            minimumOrderAmount: null,
            totalUsageLimit: quantity ? Number(quantity) : null,
            perUserUsageLimit: null,
            priority: 0,
            allowStacking: false,
            isActive: coupon?.isActive ?? true,
            startsAt: null,
            endsAt: expiresAt ? new Date(expiresAt) : null,
            userIds: selectedUserIds,
          };

          startTransition(async () => {
            setError(null);
            const result =
              isEdit && coupon
                ? await updatePromotionAction(locale, coupon.id, payload)
                : await createPromotionAction(locale, payload);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            onClose();
            router.refresh();
          });
        }}
      >
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={ADMIN_LABEL}>{copy.drawer.name}</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={copy.drawer.namePlaceholder}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>{copy.drawer.code}</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder={copy.drawer.codePlaceholder}
                className={`${ADMIN_INPUT} uppercase`}
                disabled={isPending}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={ADMIN_LABEL}>{copy.drawer.discountType}</span>
              <SelectDropdown
                ariaLabel={copy.drawer.discountTypeAria}
                value={discountType}
                options={[
                  { label: copy.drawer.percentOff, value: 'PERCENTAGE' },
                  { label: copy.drawer.fixedAmountAmd, value: 'FIXED' },
                ]}
                disabled={isPending}
                deferChange={false}
                className="mt-1"
                onValueChange={(next) => setDiscountType(next as DiscountType)}
              />
            </div>
            <label>
              <span className={ADMIN_LABEL}>{copy.drawer.value}</span>
              <input
                type="number"
                min={1}
                required
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={ADMIN_LABEL}>{copy.drawer.quantity}</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className={ADMIN_INPUT}
                disabled={isPending}
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>{copy.drawer.expiresOptional}</span>
              <DateTimeField
                locale={locale}
                value={expiresAt}
                onChange={setExpiresAt}
                placeholder={copy.drawer.expiresOptional}
                timeLabel={copy.drawer.expiresOptional}
                disabled={isPending}
              />
            </label>
          </div>

          <div>
            <span className={ADMIN_LABEL}>{copy.drawer.selectUsers}</span>
            <MultiSelectDropdown
              ariaLabel={copy.drawer.selectUsers}
              options={userOptions.map((user) => ({
                label: user.label,
                value: user.id,
                hint: user.email,
              }))}
              values={selectedUserIds}
              emptyLabel={copy.drawer.allUsersCanUse}
              searchPlaceholder={copy.drawer.searchUsers}
              noResultsLabel={copy.drawer.noUsersFound}
              disabled={isPending || userOptions.length === 0}
              placement="bottom"
              className="mt-1"
              onValuesChange={setSelectedUserIds}
            />
          </div>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-200 px-5 py-4">
          <Button type="submit" disabled={isPending}>
            {isPending
              ? isEdit
                ? copy.common.saving
                : copy.common.creating
              : isEdit
                ? copy.common.save
                : copy.common.create}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            {copy.common.cancel}
          </button>
        </div>
      </form>
    </SideSheet>
  );
}
