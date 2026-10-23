import { createId } from '@/lib/id';

export type CashChangeDenomination = {
  id: string;
  /** Whole AMD banknote amount the customer pays with. */
  amount: number;
  /** Object storage key for the banknote image; null when unset. */
  imageObjectKey: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type CashChangeDenominationView = {
  id: string;
  amount: number;
  imageUrl: string | null;
};

const STANDARD_CASH_AMOUNTS = [1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000] as const;

/** Site-hosted banknote art. Stored on the denomination so checkout does not hardcode it. */
const BUNDLED_CASH_NOTE_PATHS: Record<(typeof STANDARD_CASH_AMOUNTS)[number], string> = {
  1_000: '/brand/pideh/cash/1000.jpg',
  2_000: '/brand/pideh/cash/2000.jpg',
  5_000: '/brand/pideh/cash/5000.jpg',
  10_000: '/brand/pideh/cash/10000.jpg',
  20_000: '/brand/pideh/cash/20000.jpg',
  50_000: '/brand/pideh/cash/50000.jpg',
  100_000: '/brand/pideh/cash/100000.jpg',
};

function bundledCashNotePath(amount: number): string | null {
  if (!STANDARD_CASH_AMOUNTS.includes(amount as (typeof STANDARD_CASH_AMOUNTS)[number])) {
    return null;
  }
  return BUNDLED_CASH_NOTE_PATHS[amount as (typeof STANDARD_CASH_AMOUNTS)[number]];
}

/** Checkout sentinel: the customer does not need change. */
export const CASH_CHANGE_NOT_NEEDED = 0;

function standardDenomination(amount: number, sortOrder: number): CashChangeDenomination {
  return {
    id: `cash-change-${amount}`,
    amount,
    imageObjectKey: bundledCashNotePath(amount),
    isActive: true,
    sortOrder,
  };
}

/** Default cash-change options offered at checkout for COD. */
export function createDefaultCashChangeDenominations(): CashChangeDenomination[] {
  return STANDARD_CASH_AMOUNTS.map((amount, index) => standardDenomination(amount, index));
}

/** Adds any standard banknote that an older saved list does not include yet. */
function withStandardAmounts(items: CashChangeDenomination[]): CashChangeDenomination[] {
  const present = new Set(items.map((item) => item.amount));
  const missing = STANDARD_CASH_AMOUNTS.filter((amount) => !present.has(amount)).map((amount) =>
    standardDenomination(amount, 0),
  );
  return [...items, ...missing]
    .sort((left, right) => left.amount - right.amount)
    .map((item, index) => ({
      ...item,
      imageObjectKey: item.imageObjectKey ?? bundledCashNotePath(item.amount),
      sortOrder: index,
    }));
}

/**
 * Public URL for a cash-note image.
 * Bundled notes are site paths (`/brand/...`). Uploads go through storage.
 */
export function cashChangeImageSrc(
  imageObjectKey: string | null,
  storageUrl: (objectKey: string) => string,
): string | null {
  if (!imageObjectKey) return null;
  if (imageObjectKey.startsWith('/')) return imageObjectKey;
  return storageUrl(imageObjectKey);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseOne(raw: unknown, index: number): CashChangeDenomination | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const amountRaw = record.amount;
  const amount =
    typeof amountRaw === 'number'
      ? amountRaw
      : typeof amountRaw === 'string'
        ? Number(amountRaw)
        : NaN;
  if (!Number.isInteger(amount) || amount < 1 || amount > 100_000_000) {
    return null;
  }

  const id =
    typeof record.id === 'string' && record.id.trim().length > 0
      ? record.id.trim().slice(0, 64)
      : createId();
  const imageObjectKey =
    typeof record.imageObjectKey === 'string' && record.imageObjectKey.trim().length > 0
      ? record.imageObjectKey.trim().slice(0, 500)
      : null;
  const sortOrder = isFiniteNumber(record.sortOrder)
    ? Math.max(0, Math.floor(record.sortOrder))
    : index;

  return {
    id,
    amount,
    imageObjectKey,
    isActive: record.isActive !== false,
    sortOrder,
  };
}

/** Parses cash-change denominations from `store.delivery` JSON. */
export function parseCashChangeDenominations(value: unknown): CashChangeDenomination[] {
  if (value == null) {
    return createDefaultCashChangeDenominations();
  }
  if (!Array.isArray(value)) {
    return createDefaultCashChangeDenominations();
  }
  if (value.length === 0) {
    return [];
  }

  const parsed = value
    .map((item, index) => parseOne(item, index))
    .filter((item): item is CashChangeDenomination => item != null)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.amount - b.amount);

  return parsed.length > 0 ? withStandardAmounts(parsed) : createDefaultCashChangeDenominations();
}

/** Active denominations customers may pick at checkout (sorted). */
export function listActiveCashChangeDenominations(
  denominations: CashChangeDenomination[],
): CashChangeDenomination[] {
  return denominations
    .filter((item) => item.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.amount - b.amount);
}

/**
 * Banknotes the customer can hand over for this payable amount.
 * A 1000 note is not offered when the order is 3500 — the smallest covering note is 5000.
 */
export function cashNotesCoveringPayable<T extends { amount: number }>(
  options: readonly T[],
  payableAmount: number,
): T[] {
  const due = Math.max(0, Math.ceil(payableAmount));
  const covering = options.filter((item) => item.amount >= due);
  if (covering.length > 0) return [...covering];
  const largest = [...options].sort((left, right) => right.amount - left.amount)[0];
  return largest ? [largest] : [];
}

/** Finds an active denomination by amount, or null. */
export function findActiveCashChangeByAmount(
  denominations: CashChangeDenomination[],
  amount: number,
): CashChangeDenomination | null {
  return (
    listActiveCashChangeDenominations(denominations).find((item) => item.amount === amount) ?? null
  );
}
