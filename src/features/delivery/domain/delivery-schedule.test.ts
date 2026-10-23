import { describe, expect, it } from 'vitest';

import {
  DEFAULT_DELIVERY_SCHEDULE,
  buildSlotsForDate,
  formatYerevanDateTime,
  isDeliverySlotAvailable,
  listAvailableDeliveryDays,
  parseDeliverySchedule,
} from '@/features/delivery/domain/delivery-schedule';

describe('parseDeliverySchedule', () => {
  it('returns defaults for empty input', () => {
    expect(parseDeliverySchedule(null)).toEqual(DEFAULT_DELIVERY_SCHEDULE);
  });

  it('keeps closed dates and weekly overrides', () => {
    const parsed = parseDeliverySchedule({
      slotMinutes: 30,
      maxDaysAhead: 5,
      weekly: {
        7: { isOpen: true, openTime: '12:00', closeTime: '18:00' },
      },
      closedDates: ['2026-07-25', 'bad', '2026-07-25'],
    });

    expect(parsed.slotMinutes).toBe(30);
    expect(parsed.asapFromMinutes).toBe(DEFAULT_DELIVERY_SCHEDULE.asapFromMinutes);
    expect(parsed.asapToMinutes).toBe(DEFAULT_DELIVERY_SCHEDULE.asapToMinutes);
    expect(parsed.maxDaysAhead).toBe(5);
    expect(parsed.weekly[7]).toEqual({
      isOpen: true,
      openTime: '12:00',
      closeTime: '18:00',
    });
    expect(parsed.weekly[1].isOpen).toBe(true);
    expect(parsed.closedDates).toEqual(['2026-07-25']);
  });
});

describe('buildSlotsForDate', () => {
  const schedule = {
    ...DEFAULT_DELIVERY_SCHEDULE,
    slotMinutes: 60,
    closedDates: ['2026-07-26'],
    weekly: {
      ...DEFAULT_DELIVERY_SCHEDULE.weekly,
      5: { isOpen: true, openTime: '10:00', closeTime: '13:00' },
      7: { isOpen: false, openTime: '10:00', closeTime: '22:00' },
    },
  };

  it('builds hourly slots inside open hours', () => {
    // 2026-07-24 is Friday — use morning so past-slot filter does not drop slots
    const now = new Date('2026-07-24T04:00:00.000Z');
    expect(buildSlotsForDate(schedule, '2026-07-24', now)).toEqual([
      { startTime: '10:00', endTime: '11:00', label: '10:00–11:00' },
      { startTime: '11:00', endTime: '12:00', label: '11:00–12:00' },
      { startTime: '12:00', endTime: '13:00', label: '12:00–13:00' },
    ]);
  });

  it('returns no slots for closed weekday or blackout date', () => {
    expect(buildSlotsForDate(schedule, '2026-07-26')).toEqual([]); // Sunday blackout
    expect(buildSlotsForDate({ ...schedule, closedDates: [] }, '2026-07-26')).toEqual([]); // Sunday closed
  });
});

describe('listAvailableDeliveryDays / isDeliverySlotAvailable', () => {
  it('lists only days with remaining slots', () => {
    const schedule = {
      ...DEFAULT_DELIVERY_SCHEDULE,
      maxDaysAhead: 3,
      weekly: {
        1: { isOpen: false, openTime: '10:00', closeTime: '22:00' },
        2: { isOpen: false, openTime: '10:00', closeTime: '22:00' },
        3: { isOpen: false, openTime: '10:00', closeTime: '22:00' },
        4: { isOpen: false, openTime: '10:00', closeTime: '22:00' },
        5: { isOpen: true, openTime: '10:00', closeTime: '12:00' },
        6: { isOpen: false, openTime: '10:00', closeTime: '22:00' },
        7: { isOpen: false, openTime: '10:00', closeTime: '22:00' },
      },
      closedDates: [],
    };

    // Friday 2026-07-24 08:00 Yerevan = 04:00 UTC
    const now = new Date('2026-07-24T04:00:00.000Z');
    const days = listAvailableDeliveryDays(schedule, now);
    expect(days.map((day) => day.date)).toEqual(['2026-07-24']);
    expect(
      isDeliverySlotAvailable(
        schedule,
        { date: '2026-07-24', startTime: '10:00', endTime: '11:00' },
        now,
      ),
    ).toBe(true);
    expect(
      isDeliverySlotAvailable(
        schedule,
        { date: '2026-07-24', startTime: '15:00', endTime: '16:00' },
        now,
      ),
    ).toBe(false);
  });
});

describe('formatYerevanDateTime', () => {
  it('formats UTC instants in Asia/Yerevan wall time', () => {
    // 12:00 UTC → 16:00 in Yerevan (UTC+4, no DST).
    expect(formatYerevanDateTime(new Date('2026-09-07T12:00:00.000Z'))).toBe('2026-09-07 16:00');
  });
});
