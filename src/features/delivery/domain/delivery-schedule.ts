/** ISO weekday: Monday = 1 … Sunday = 7. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type DayHours = {
  isOpen: boolean;
  /** Local wall time `HH:mm` (Asia/Yerevan). */
  openTime: string;
  /** Local wall time `HH:mm` (Asia/Yerevan). Must be after openTime. */
  closeTime: string;
};

export type DeliveryScheduleSettings = {
  timezone: 'Asia/Yerevan';
  /** Length of each bookable slot in minutes. */
  slotMinutes: number;
  /** How many calendar days ahead (including today) customers may book. */
  maxDaysAhead: number;
  weekly: Record<IsoWeekday, DayHours>;
  /** Closed calendar dates `YYYY-MM-DD` (store holidays / blackout days). */
  closedDates: string[];
};

export type DeliveryTimeSlot = {
  startTime: string;
  endTime: string;
  label: string;
};

export type DeliveryDayAvailability = {
  date: string;
  slots: DeliveryTimeSlot[];
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DEFAULT_DAY_OPEN: DayHours = {
  isOpen: true,
  openTime: '10:00',
  closeTime: '22:00',
};

const DEFAULT_DAY_CLOSED: DayHours = {
  isOpen: false,
  openTime: '10:00',
  closeTime: '22:00',
};

/** Default Mon–Sat 10:00–22:00, Sunday closed. */
export const DEFAULT_DELIVERY_SCHEDULE: DeliveryScheduleSettings = {
  timezone: 'Asia/Yerevan',
  slotMinutes: 60,
  maxDaysAhead: 7,
  weekly: {
    1: { ...DEFAULT_DAY_OPEN },
    2: { ...DEFAULT_DAY_OPEN },
    3: { ...DEFAULT_DAY_OPEN },
    4: { ...DEFAULT_DAY_OPEN },
    5: { ...DEFAULT_DAY_OPEN },
    6: { ...DEFAULT_DAY_OPEN },
    7: { ...DEFAULT_DAY_CLOSED },
  },
  closedDates: [],
};

export const ISO_WEEKDAY_LABELS_EN: Record<IsoWeekday, string> = {
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
  7: 'Sunday',
};

export function isValidTimeHHmm(value: string): boolean {
  return TIME_PATTERN.test(value);
}

function parseYmdParts(dateYmd: string): {
  year: number;
  month: number;
  day: number;
} {
  const [yearText, monthText, dayText] = dateYmd.split('-');
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
}

export function isValidDateYmd(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const { year, month, day } = parseYmdParts(value);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

export function timeToMinutes(value: string): number {
  const [hoursText, minutesText] = value.split(':');
  return Number(hoursText) * 60 + Number(minutesText);
}

function minutesToTime(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function parseDayHours(value: unknown, fallback: DayHours): DayHours {
  if (!value || typeof value !== 'object') {
    return { ...fallback };
  }
  const record = value as Record<string, unknown>;
  const openTime =
    typeof record.openTime === 'string' && isValidTimeHHmm(record.openTime)
      ? record.openTime
      : fallback.openTime;
  const closeTime =
    typeof record.closeTime === 'string' && isValidTimeHHmm(record.closeTime)
      ? record.closeTime
      : fallback.closeTime;
  const openOk = timeToMinutes(closeTime) > timeToMinutes(openTime);
  return {
    isOpen: record.isOpen === true,
    openTime,
    closeTime: openOk ? closeTime : fallback.closeTime,
  };
}

/** Parses schedule JSON; unknown/invalid parts fall back to defaults. */
export function parseDeliverySchedule(value: unknown): DeliveryScheduleSettings {
  if (!value || typeof value !== 'object') {
    return structuredClone(DEFAULT_DELIVERY_SCHEDULE);
  }

  const record = value as Record<string, unknown>;
  const slotMinutes =
    typeof record.slotMinutes === 'number' &&
    Number.isInteger(record.slotMinutes) &&
    record.slotMinutes >= 15 &&
    record.slotMinutes <= 240
      ? record.slotMinutes
      : DEFAULT_DELIVERY_SCHEDULE.slotMinutes;
  const maxDaysAhead =
    typeof record.maxDaysAhead === 'number' &&
    Number.isInteger(record.maxDaysAhead) &&
    record.maxDaysAhead >= 1 &&
    record.maxDaysAhead <= 60
      ? record.maxDaysAhead
      : DEFAULT_DELIVERY_SCHEDULE.maxDaysAhead;

  const weeklySource =
    record.weekly && typeof record.weekly === 'object'
      ? (record.weekly as Record<string, unknown>)
      : {};

  const weekly = { ...DEFAULT_DELIVERY_SCHEDULE.weekly };
  for (const day of [1, 2, 3, 4, 5, 6, 7] as const) {
    weekly[day] = parseDayHours(
      weeklySource[String(day)] ?? weeklySource[day],
      DEFAULT_DELIVERY_SCHEDULE.weekly[day],
    );
  }

  const closedDates = Array.isArray(record.closedDates)
    ? [
        ...new Set(
          record.closedDates.filter(
            (entry): entry is string => typeof entry === 'string' && isValidDateYmd(entry),
          ),
        ),
      ].sort()
    : [];

  return {
    timezone: 'Asia/Yerevan',
    slotMinutes,
    maxDaysAhead,
    weekly,
    closedDates,
  };
}

/** Formats a Date as `YYYY-MM-DD` in Asia/Yerevan. */
export function formatYerevanDate(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Yerevan',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** Formats a Date as `HH:mm` in Asia/Yerevan. */
export function formatYerevanTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Yerevan',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

/** Formats a Date as `YYYY-MM-DD HH:mm` in Asia/Yerevan. */
export function formatYerevanDateTime(date: Date | string): string {
  const value = date instanceof Date ? date : new Date(date);
  return `${formatYerevanDate(value)} ${formatYerevanTime(value)}`;
}

/** ISO weekday (Mon=1 … Sun=7) for a `YYYY-MM-DD` calendar date. */
export function isoWeekdayFromYmd(dateYmd: string): IsoWeekday {
  const { year, month, day } = parseYmdParts(dateYmd);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const jsDay = utc.getUTCDay();
  return (jsDay === 0 ? 7 : jsDay) as IsoWeekday;
}

function addDaysYmd(dateYmd: string, days: number): string {
  const { year, month, day } = parseYmdParts(dateYmd);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`;
}

function yerevanDateTimeToUtc(dateYmd: string, timeHHmm: string): Date {
  return new Date(`${dateYmd}T${timeHHmm}:00+04:00`);
}

/** Builds bookable slots for one calendar day. */
export function buildSlotsForDate(
  schedule: DeliveryScheduleSettings,
  dateYmd: string,
  now: Date = new Date(),
): DeliveryTimeSlot[] {
  if (!isValidDateYmd(dateYmd)) return [];
  if (schedule.closedDates.includes(dateYmd)) return [];

  const dayHours = schedule.weekly[isoWeekdayFromYmd(dateYmd)];
  if (!dayHours.isOpen) return [];

  const openMinutes = timeToMinutes(dayHours.openTime);
  const closeMinutes = timeToMinutes(dayHours.closeTime);
  if (closeMinutes <= openMinutes) return [];

  const todayYmd = formatYerevanDate(now);
  const slots: DeliveryTimeSlot[] = [];

  for (
    let start = openMinutes;
    start + schedule.slotMinutes <= closeMinutes;
    start += schedule.slotMinutes
  ) {
    const end = start + schedule.slotMinutes;
    const startTime = minutesToTime(start);
    const endTime = minutesToTime(end);
    if (dateYmd === todayYmd) {
      const slotStartUtc = yerevanDateTimeToUtc(dateYmd, startTime);
      if (slotStartUtc.getTime() < now.getTime()) {
        continue;
      }
    }
    slots.push({
      startTime,
      endTime,
      label: `${startTime}–${endTime}`,
    });
  }

  return slots;
}

/** Lists available delivery days (with slots) from today through maxDaysAhead. */
export function listAvailableDeliveryDays(
  schedule: DeliveryScheduleSettings,
  now: Date = new Date(),
): DeliveryDayAvailability[] {
  const startYmd = formatYerevanDate(now);
  const days: DeliveryDayAvailability[] = [];

  for (let offset = 0; offset < schedule.maxDaysAhead; offset += 1) {
    const date = addDaysYmd(startYmd, offset);
    const slots = buildSlotsForDate(schedule, date, now);
    if (slots.length > 0) {
      days.push({ date, slots });
    }
  }

  return days;
}

export type SelectedDeliverySlot = {
  date: string;
  startTime: string;
  endTime: string;
};

/** True when the selected slot is still bookable under the schedule. */
export function isDeliverySlotAvailable(
  schedule: DeliveryScheduleSettings,
  selected: SelectedDeliverySlot,
  now: Date = new Date(),
): boolean {
  const slots = buildSlotsForDate(schedule, selected.date, now);
  return slots.some(
    (slot) => slot.startTime === selected.startTime && slot.endTime === selected.endTime,
  );
}

/** Human-readable snapshot for order storage / admin. */
export function formatDeliverySlotSnapshot(selected: SelectedDeliverySlot): string {
  return `${selected.date} ${selected.startTime}–${selected.endTime}`;
}

/** Stored when the customer keeps the default ASAP promise (30-45 minutes). */
export const ASAP_DELIVERY_ESTIMATE_SNAPSHOT = 'approximately 30-45 minutes';
