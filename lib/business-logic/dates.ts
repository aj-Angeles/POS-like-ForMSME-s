import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import type { DateRange, Period } from "../types";

export function rangeForPeriod(period: Period, now = new Date()): DateRange {
  switch (period) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "week":
      return { from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfWeek(now, { weekStartsOn: 1 }) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "custom":
    default:
      return { from: startOfDay(now), to: endOfDay(now) };
  }
}

export function formatRange(range: DateRange): string {
  return `${format(range.from, "MMM d, yyyy")} – ${format(range.to, "MMM d, yyyy")}`;
}

export function toISODate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}
