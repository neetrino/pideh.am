import { describe, expect, it } from 'vitest';

import {
  cashNotesCoveringPayable,
  createDefaultCashChangeDenominations,
  findActiveCashChangeByAmount,
  listActiveCashChangeDenominations,
  parseCashChangeDenominations,
} from '@/features/delivery/domain/cash-change';

describe('cash-change denominations', () => {
  it('defaults to 1k through 100k banknotes', () => {
    expect(createDefaultCashChangeDenominations().map((item) => item.amount)).toEqual([
      1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000,
    ]);
  });

  it('adds missing standard banknotes to an older saved list', () => {
    const parsed = parseCashChangeDenominations([
      { id: 'a', amount: 10_000, isActive: true, sortOrder: 0 },
      { id: 'b', amount: 100_000, isActive: true, sortOrder: 1 },
    ]);
    expect(parsed.map((item) => item.amount)).toEqual([
      1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000,
    ]);
    expect(parsed.find((item) => item.amount === 10_000)?.id).toBe('a');
    expect(parsed.find((item) => item.amount === 10_000)?.imageObjectKey).toBe(
      '/brand/pideh/cash/10000.jpg',
    );
    expect(parsed.find((item) => item.amount === 1_000)?.imageObjectKey).toBe(
      '/brand/pideh/cash/1000.jpg',
    );
  });

  it('restores defaults when value is missing', () => {
    expect(parseCashChangeDenominations(null)).toEqual(createDefaultCashChangeDenominations());
  });

  it('keeps an explicit empty list', () => {
    expect(parseCashChangeDenominations([])).toEqual([]);
  });

  it('filters to active denominations', () => {
    const active = listActiveCashChangeDenominations([
      {
        id: 'a',
        amount: 10_000,
        imageObjectKey: null,
        isActive: false,
        sortOrder: 0,
      },
      {
        id: 'b',
        amount: 20_000,
        imageObjectKey: 'uploads/x.jpg',
        isActive: true,
        sortOrder: 1,
      },
    ]);
    expect(active).toHaveLength(1);
    expect(active[0]?.amount).toBe(20_000);
  });

  it('hides banknotes smaller than the amount due', () => {
    const notes = createDefaultCashChangeDenominations();
    expect(cashNotesCoveringPayable(notes, 3500).map((item) => item.amount)).toEqual([
      5_000, 10_000, 20_000, 50_000, 100_000,
    ]);
    expect(cashNotesCoveringPayable(notes, 5000).map((item) => item.amount)[0]).toBe(5_000);
  });

  it('finds an active denomination by amount', () => {
    const list = createDefaultCashChangeDenominations();
    expect(findActiveCashChangeByAmount(list, 50_000)?.amount).toBe(50_000);
    expect(findActiveCashChangeByAmount(list, 999)).toBeNull();
  });
});
