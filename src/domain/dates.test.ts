import { describe, expect, it } from "vitest";
import {
  addMonthsToKey,
  addYearsToDay,
  clampDayToMonth,
  compareMonthKeys,
  dayKeyOfDate,
  daysBetween,
  daysInMonth,
  daysLeft,
  fromISODate,
  isDayKey,
  isMonthKey,
  isoForDay,
  monthKeyOf,
  monthKeyOfDate,
  monthsInclusive,
  nextDay,
  previousMonthKey,
  toISODate,
} from "./dates";

describe("PRD §7.5 example 8: month boundary", () => {
  it("23:59:59 on 30 Nov belongs to November; 00:00:00 on 1 Dec to December", () => {
    expect(monthKeyOf("2026-11-30T23:59:59")).toBe("2026-11");
    expect(monthKeyOf("2026-12-01T00:00:00")).toBe("2026-12");
    expect(monthKeyOfDate(new Date(2026, 10, 30, 23, 59, 59))).toBe("2026-11");
    expect(monthKeyOfDate(new Date(2026, 11, 1, 0, 0, 0))).toBe("2026-12");
  });

  it("PRD §13: an expense logged just after midnight belongs to the new month", () => {
    expect(monthKeyOf(toISODate(new Date(2026, 11, 1, 0, 3)))).toBe("2026-12");
  });
});

describe("PRD §7.5 example 9: the day 31 rule", () => {
  it("day 31 is the 30th in November and the 28th/29th in February", () => {
    expect(clampDayToMonth(31, "2026-11")).toBe(30);
    expect(clampDayToMonth(31, "2027-02")).toBe(28);
    expect(clampDayToMonth(31, "2028-02")).toBe(29);
    expect(clampDayToMonth(15, "2027-02")).toBe(15);
  });
});

describe("PRD §7.1 month maths", () => {
  it("days in month, including leap years", () => {
    expect(daysInMonth("2026-11")).toBe(30);
    expect(daysInMonth("2026-12")).toBe(31);
    expect(daysInMonth("2027-02")).toBe(28);
    expect(daysInMonth("2028-02")).toBe(29);
  });

  it("days left includes today", () => {
    expect(daysLeft(18, 30)).toBe(13);
    expect(daysLeft(30, 30)).toBe(1);
    expect(daysLeft(1, 31)).toBe(31);
  });

  it("months counted inclusively, across years", () => {
    expect(monthsInclusive("2026-11", "2027-03")).toBe(5);
    expect(monthsInclusive("2026-11", "2026-11")).toBe(1);
    expect(monthsInclusive("2027-04", "2027-03")).toBe(0);
  });

  it("adds and compares months across year ends", () => {
    expect(addMonthsToKey("2026-12", 1)).toBe("2027-01");
    expect(previousMonthKey("2027-01")).toBe("2026-12");
    expect(compareMonthKeys("2026-12", "2027-01")).toBeLessThan(0);
    expect(compareMonthKeys("2027-01", "2027-01")).toBe(0);
  });
});

describe("local date-times without a timezone (decision e)", () => {
  it("round-trip through a Date in local time", () => {
    const iso = "2026-11-18T13:42:05";
    expect(toISODate(fromISODate(iso))).toBe(iso);
    expect(dayKeyOfDate(fromISODate("2027-03-15"))).toBe("2027-03-15");
  });

  it("builds a day's date-time, e.g. 09:00 for recurring entries", () => {
    expect(isoForDay("2026-11", 28, 9)).toBe("2026-11-28T09:00:00");
  });

  it("checks keys", () => {
    expect(isMonthKey("2026-11")).toBe(true);
    expect(isMonthKey("2026-13")).toBe(false);
    expect(isDayKey("2026-11-31")).toBe(true); // shape only
    expect(isDayKey("2026-11-1")).toBe(false);
  });
});

describe("days and years", () => {
  it("next day crosses month and year ends", () => {
    expect(nextDay("2027-03-15")).toBe("2027-03-16");
    expect(nextDay("2026-12-31")).toBe("2027-01-01");
  });

  it("29 Feb plus a year is 28 Feb", () => {
    expect(addYearsToDay("2028-02-29", 1)).toBe("2029-02-28");
  });

  it("whole days between dates, unaffected by daylight-saving changes", () => {
    expect(daysBetween("2026-11-01", "2026-12-06")).toBe(35);
    expect(daysBetween("2026-03-01", "2026-04-01")).toBe(31);
  });
});
