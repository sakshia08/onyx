/**
 * Months and days (PRD §7.1). Everything is the phone's local time.
 * Saved dates are local date-times without a timezone ("2026-11-30T23:59:59"),
 * so the month an entry belongs to is simply its first seven characters.
 */

import { addMonths, addYears, format, getDaysInMonth, parse } from "date-fns";
import type { DayKey, ISODate, MonthKey } from "./types";

const MONTH_FORMAT = "yyyy-MM";
const DAY_FORMAT = "yyyy-MM-dd";
const ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_KEY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function isMonthKey(value: string): value is MonthKey {
  return MONTH_KEY.test(value);
}

export function isDayKey(value: string): value is DayKey {
  return DAY_KEY.test(value);
}

/** A Date as a saved local date-time. */
export function toISODate(date: Date): ISODate {
  return format(date, ISO_FORMAT);
}

/** A saved local date-time (or day) back to a Date in local time. */
export function fromISODate(value: string): Date {
  return value.length === 10
    ? parse(value, DAY_FORMAT, new Date(0))
    : parse(value, ISO_FORMAT, new Date(0));
}

/** "2026-11" for any Date. */
export function monthKeyOfDate(date: Date): MonthKey {
  return format(date, MONTH_FORMAT);
}

/** "2026-11" for a saved date-time or day. */
export function monthKeyOf(value: string): MonthKey {
  return value.slice(0, 7);
}

/** "2026-11-18" for any Date. */
export function dayKeyOfDate(date: Date): DayKey {
  return format(date, DAY_FORMAT);
}

/** "2026-11-18" for a saved date-time. */
export function dayKeyOf(value: ISODate): DayKey {
  return value.slice(0, 10);
}

function monthStart(key: MonthKey): Date {
  return parse(key, MONTH_FORMAT, new Date(0));
}

export function daysInMonth(key: MonthKey): number {
  return getDaysInMonth(monthStart(key));
}

/** Negative if a is earlier, 0 if the same month, positive if later. */
export function compareMonthKeys(a: MonthKey, b: MonthKey): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function addMonthsToKey(key: MonthKey, months: number): MonthKey {
  return monthKeyOfDate(addMonths(monthStart(key), months));
}

/** The previous calendar month, e.g. "2026-11" → "2026-10". */
export function previousMonthKey(key: MonthKey): MonthKey {
  return addMonthsToKey(key, -1);
}

/** Months from `from` to `to`, counting both ends. "2026-11" → "2027-03" is 5. Zero or less if `to` is earlier. */
export function monthsInclusive(from: MonthKey, to: MonthKey): number {
  const [fy, fm] = from.split("-").map(Number) as [number, number];
  const [ty, tm] = to.split("-").map(Number) as [number, number];
  return (ty - fy) * 12 + (tm - fm) + 1;
}

/** Days left in the month, including today (PRD §7.1). */
export function daysLeft(today: number, days: number): number {
  return days - today + 1;
}

/**
 * The day a monthly event lands on: day 29–31 moves to the last day in shorter months
 * (PRD §7.5 example 9, §8.7).
 */
export function clampDayToMonth(dayOfMonth: number, key: MonthKey): number {
  return Math.min(Math.max(1, dayOfMonth), daysInMonth(key));
}

/** The saved date-time for a given day of a month at a given time, e.g. 09:00. */
export function isoForDay(key: MonthKey, day: number, hours = 0, minutes = 0): ISODate {
  const d = monthStart(key);
  d.setDate(day);
  d.setHours(hours, minutes, 0, 0);
  return toISODate(d);
}

/** The first moment of a month, "2026-11-01T00:00:00". */
export function monthStartISO(key: MonthKey): ISODate {
  return `${key}-01T00:00:00`;
}

/** A day plus whole years, with 29 Feb landing on 28 Feb in non-leap years. */
export function addYearsToDay(day: DayKey, years: number): DayKey {
  return dayKeyOfDate(addYears(fromISODate(day), years));
}

/** The day after, e.g. "2027-03-15" → "2027-03-16". */
export function nextDay(day: DayKey): DayKey {
  const d = fromISODate(day);
  d.setDate(d.getDate() + 1);
  return dayKeyOfDate(d);
}

/** Whole days from a to b (b later is positive), ignoring the time of day. */
export function daysBetween(a: DayKey, b: DayKey): number {
  const ms = Date.UTC(...ymd(b)) - Date.UTC(...ymd(a));
  return Math.round(ms / 86_400_000);
}

function ymd(day: DayKey): [number, number, number] {
  const [y, m, d] = day.split("-").map(Number) as [number, number, number];
  return [y, m - 1, d];
}

/**
 * Today's day number for a month's maths: the real day when `now` is in that month,
 * the last day once the month is over, and day 1 if the clock is earlier than the month.
 */
export function dayInMonth(key: MonthKey, now: Date): number {
  const order = compareMonthKeys(monthKeyOfDate(now), key);
  if (order > 0) return daysInMonth(key);
  if (order < 0) return 1;
  return now.getDate();
}

/** "November" for "2026-11". */
export function monthName(key: MonthKey): string {
  return format(parse(key, MONTH_FORMAT, new Date(0)), "MMMM");
}
