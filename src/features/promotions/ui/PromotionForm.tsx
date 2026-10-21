'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DateTimeField } from '@/components/ui/DateTimeField';
import { FormSelect } from '@/components/ui/FormSelect';
import {
  ADMIN_CHECKBOX,
  ADMIN_CHECKBOX_LABEL,
  ADMIN_INPUT,
  ADMIN_LABEL,
  ADMIN_SECTION_TITLE,
} from '@/features/admin/ui/admin-form-classes';
import {
  createPromotionAction,
  updatePromotionAction,
} from '@/features/promotions/application/upsert-promotion';
import type { DiscountType, PromotionKind } from '@/features/promotions/domain/promotion-rules';
import type { UpsertPromotionInput } from '@/features/promotions/schemas/admin-promotions';
import type { Dictionary } from '@/lib/i18n/get-dictionary';

type TargetOptions = {
  products: Array<{ id: string; sku: string; title: string }>;
  categories: Array<{ id: string; title: string }>;
};

type PromotionFormCopy = {
  form: Dictionary['admin']['discounts']['form'];
  common: Dictionary['admin']['common'];
};

type PromotionFormProps = {
  locale: string;
  mode: 'create' | 'edit';
  promotionId?: string;
  initialKind: PromotionKind;
  lockKind?: boolean;
  defaults?: Partial<{
    code: string | null;
    productId: string | null;
    categoryId: string | null;
    discountType: DiscountType;
    discountValue: number;
    maxDiscountAmount: number | null;
    minimumOrderAmount: number | null;
    totalUsageLimit: number | null;
    perUserUsageLimit: number | null;
    priority: number;
    allowStacking: boolean;
    isActive: boolean;
    startsAt: Date | null;
    endsAt: Date | null;
  }>;
  targets: TargetOptions;
  redirectTo: string;
  copy: PromotionFormCopy;
};

function toDateInput(value: Date | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.toISOString().slice(0, 16);
}

export function PromotionForm({
  locale,
  mode,
  promotionId,
  initialKind,
  lockKind = false,
  defaults,
  targets,
  redirectTo,
  copy,
}: PromotionFormProps) {
  const router = useRouter();
  const [kind, setKind] = useState<PromotionKind>(initialKind);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title = useMemo(() => {
    if (mode === 'edit') {
      return copy.form.editPromotion;
    }
    return kind === 'COUPON' ? copy.form.createCoupon : copy.form.createAutomaticDiscount;
  }, [kind, mode, copy.form]);

  return (
    <Card className="max-w-xl p-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const payload: UpsertPromotionInput = {
            kind: String(formData.get('kind') ?? kind) as PromotionKind,
            code: String(formData.get('code') ?? '') || null,
            productId: String(formData.get('productId') ?? '') || null,
            categoryId: String(formData.get('categoryId') ?? '') || null,
            discountType: String(formData.get('discountType')) as DiscountType,
            discountValue: Number(formData.get('discountValue')),
            maxDiscountAmount: String(formData.get('maxDiscountAmount') ?? '')
              ? Number(formData.get('maxDiscountAmount'))
              : null,
            minimumOrderAmount: String(formData.get('minimumOrderAmount') ?? '')
              ? Number(formData.get('minimumOrderAmount'))
              : null,
            totalUsageLimit: String(formData.get('totalUsageLimit') ?? '')
              ? Number(formData.get('totalUsageLimit'))
              : null,
            perUserUsageLimit: String(formData.get('perUserUsageLimit') ?? '')
              ? Number(formData.get('perUserUsageLimit'))
              : null,
            priority: Number(formData.get('priority') ?? 0),
            allowStacking: formData.get('allowStacking') === 'on',
            isActive: formData.get('isActive') === 'on',
            startsAt: String(formData.get('startsAt') ?? '')
              ? new Date(String(formData.get('startsAt')))
              : null,
            endsAt: String(formData.get('endsAt') ?? '')
              ? new Date(String(formData.get('endsAt')))
              : null,
            userIds: [],
          };

          startTransition(async () => {
            setError(null);
            const result =
              mode === 'edit' && promotionId
                ? await updatePromotionAction(locale, promotionId, payload)
                : await createPromotionAction(locale, payload);

            if (!result.ok) {
              setError(result.error.message);
              return;
            }

            router.push(redirectTo);
            router.refresh();
          });
        }}
      >
        <h2 className={ADMIN_SECTION_TITLE}>{title}</h2>

        <label>
          <span className={ADMIN_LABEL}>{copy.form.kind}</span>
          <FormSelect
            name="kind"
            ariaLabel={copy.form.kind}
            value={kind}
            disabled={lockKind || isPending}
            options={[
              { value: 'COUPON', label: copy.form.kindCoupon },
              { value: 'AUTOMATIC', label: copy.form.kindAutomatic },
            ]}
            onValueChange={(next) => setKind(next as PromotionKind)}
          />
        </label>

        {kind === 'COUPON' ? (
          <label>
            <span className={ADMIN_LABEL}>{copy.form.code}</span>
            <input
              name="code"
              required
              defaultValue={defaults?.code ?? ''}
              className={`${ADMIN_INPUT} uppercase`}
              placeholder={copy.form.codePlaceholder}
              disabled={isPending}
            />
          </label>
        ) : (
          <>
            <label>
              <span className={ADMIN_LABEL}>{copy.form.productTarget}</span>
              <FormSelect
                name="productId"
                ariaLabel={copy.form.productTarget}
                allLabel={copy.form.noneTarget}
                defaultValue={defaults?.productId ?? ''}
                disabled={isPending}
                options={targets.products.map((product) => ({
                  value: product.id,
                  label: `${product.sku} · ${product.title}`,
                }))}
              />
            </label>
            <label>
              <span className={ADMIN_LABEL}>{copy.form.categoryTarget}</span>
              <FormSelect
                name="categoryId"
                ariaLabel={copy.form.categoryTarget}
                allLabel={copy.form.noneTarget}
                defaultValue={defaults?.categoryId ?? ''}
                disabled={isPending}
                options={targets.categories.map((category) => ({
                  value: category.id,
                  label: category.title,
                }))}
              />
            </label>
            <p className="text-xs text-gray-500">{copy.form.chooseOneTarget}</p>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.form.discountType}</span>
            <FormSelect
              name="discountType"
              ariaLabel={copy.form.discountType}
              defaultValue={defaults?.discountType ?? 'PERCENTAGE'}
              disabled={isPending}
              options={[
                { value: 'PERCENTAGE', label: copy.form.percentage },
                { value: 'FIXED', label: copy.form.fixedAmd },
              ]}
            />
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.form.discountValue}</span>
            <input
              name="discountValue"
              type="number"
              required
              min={1}
              defaultValue={defaults?.discountValue ?? 10}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.form.maxDiscountOptional}</span>
            <input
              name="maxDiscountAmount"
              type="number"
              min={1}
              defaultValue={defaults?.maxDiscountAmount ?? ''}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.form.minOrderOptional}</span>
            <input
              name="minimumOrderAmount"
              type="number"
              min={0}
              defaultValue={defaults?.minimumOrderAmount ?? ''}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.form.totalUsageLimit}</span>
            <input
              name="totalUsageLimit"
              type="number"
              min={1}
              defaultValue={defaults?.totalUsageLimit ?? ''}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.form.perUserLimit}</span>
            <input
              name="perUserUsageLimit"
              type="number"
              min={1}
              defaultValue={defaults?.perUserUsageLimit ?? ''}
              className={ADMIN_INPUT}
              disabled={isPending}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={ADMIN_LABEL}>{copy.form.startsAt}</span>
            <DateTimeField
              locale={locale}
              name="startsAt"
              defaultValue={toDateInput(defaults?.startsAt)}
              placeholder={copy.form.startsAt}
              timeLabel={copy.form.startsAt}
              disabled={isPending}
            />
          </label>
          <label>
            <span className={ADMIN_LABEL}>{copy.form.endsAt}</span>
            <DateTimeField
              locale={locale}
              name="endsAt"
              defaultValue={toDateInput(defaults?.endsAt)}
              placeholder={copy.form.endsAt}
              timeLabel={copy.form.endsAt}
              disabled={isPending}
            />
          </label>
        </div>

        <label>
          <span className={ADMIN_LABEL}>{copy.form.priority}</span>
          <input
            name="priority"
            type="number"
            min={0}
            defaultValue={defaults?.priority ?? 0}
            className={ADMIN_INPUT}
            disabled={isPending}
          />
        </label>

        <label className={ADMIN_CHECKBOX_LABEL}>
          <input
            type="checkbox"
            name="allowStacking"
            defaultChecked={defaults?.allowStacking ?? false}
            disabled={isPending}
            className={ADMIN_CHECKBOX}
          />
          {copy.form.allowStacking}
        </label>
        <label className={ADMIN_CHECKBOX_LABEL}>
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={defaults?.isActive ?? true}
            disabled={isPending}
            className={ADMIN_CHECKBOX}
          />
          {copy.form.active}
        </label>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? mode === 'edit'
              ? copy.common.saving
              : copy.common.creating
            : mode === 'edit'
              ? copy.form.saveChanges
              : copy.common.create}
        </Button>
      </form>
    </Card>
  );
}
