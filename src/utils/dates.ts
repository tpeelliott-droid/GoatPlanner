import { Timestamp } from "firebase/firestore";
import {
  format,
  formatDistanceToNow,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
} from "date-fns";

export function toDate(ts: Timestamp | Date | null | undefined): Date | null {
  if (!ts) return null;
  if (ts instanceof Date) return ts;
  return ts.toDate();
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function friendlyDate(ts: Timestamp | Date | null | undefined): string {
  const date = toDate(ts);
  if (!date) return "";
  if (isToday(date)) return `Today, ${format(date, "HH:mm")}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, "HH:mm")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "HH:mm")}`;
  return format(date, "EEE d MMM, HH:mm");
}

export function shortDate(ts: Timestamp | Date | null | undefined): string {
  const date = toDate(ts);
  if (!date) return "";
  return format(date, "EEE d MMM");
}

export function relativeTime(ts: Timestamp | Date | null | undefined): string {
  const date = toDate(ts);
  if (!date) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function isOverdue(ts: Timestamp | Date | null | undefined): boolean {
  const date = toDate(ts);
  if (!date) return false;
  return isPast(date) && !isToday(date);
}

export function isDueToday(ts: Timestamp | Date | null | undefined): boolean {
  const date = toDate(ts);
  if (!date) return false;
  return isToday(date);
}
