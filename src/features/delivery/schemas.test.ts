import { describe, expect, it } from 'vitest';

import { deliverySettingsSchema } from '@/features/delivery/schemas';
import { DEFAULT_DELIVERY_SCHEDULE } from '@/features/delivery/domain/delivery-schedule';

describe('deliverySettingsSchema', () => {
  const base = {
    originAddress: 'Yerevan, Armenia',
    pricePerKmAmount: 1000,
    isActive: true,
    schedule: {
      slotMinutes: DEFAULT_DELIVERY_SCHEDULE.slotMinutes,
      asapFromMinutes: DEFAULT_DELIVERY_SCHEDULE.asapFromMinutes,
      asapToMinutes: DEFAULT_DELIVERY_SCHEDULE.asapToMinutes,
      maxDaysAhead: DEFAULT_DELIVERY_SCHEDULE.maxDaysAhead,
      weekly: DEFAULT_DELIVERY_SCHEDULE.weekly,
      closedDates: [] as string[],
    },
    cashChangeDenominations: [
      {
        id: 'cash-change-10000',
        amount: 10_000,
        imageObjectKey: null,
        isActive: true,
        sortOrder: 0,
      },
    ],
  };

  it('accepts HH:mm times', () => {
    expect(deliverySettingsSchema.safeParse(base).success).toBe(true);
  });

  it('accepts an explicit store map pin', () => {
    const parsed = deliverySettingsSchema.safeParse({
      ...base,
      originLat: 40.1792,
      originLng: 44.4991,
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a partial store map pin', () => {
    const parsed = deliverySettingsSchema.safeParse({
      ...base,
      originLat: 40.1792,
    });
    expect(parsed.success).toBe(false);
  });

  it('normalizes HH:mm:ss from time inputs', () => {
    const parsed = deliverySettingsSchema.safeParse({
      ...base,
      schedule: {
        ...base.schedule,
        weekly: {
          ...base.schedule.weekly,
          1: { isOpen: true, openTime: '10:00:00', closeTime: '22:30:00' },
        },
      },
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.schedule.weekly[1]).toEqual({
      isOpen: true,
      openTime: '10:00',
      closeTime: '22:30',
    });
  });
});
