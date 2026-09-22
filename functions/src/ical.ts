import type { Timestamp } from "firebase-admin/firestore";

interface IcsEvent {
  id: string;
  title: string;
  start: Timestamp;
  end: Timestamp;
  allDay: boolean;
  location?: string;
  notes?: string;
  updatedAt: Timestamp | null;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateUTC(date: Date): string {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T` +
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function formatDateOnly(date: Date): string {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Builds a minimal RFC 5545 ICS feed — no external deps needed for this small shape. */
export function buildIcsFeed(events: IcsEvent[], calendarName: string): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Goat Track Planner//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT4H",
  ];

  for (const event of events) {
    const start = event.start.toDate();
    const end = event.end.toDate();
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${event.id}@goattrackplanner`);
    lines.push(`DTSTAMP:${formatDateUTC(new Date())}`);
    if (event.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(start)}`);
      lines.push(`DTEND;VALUE=DATE:${formatDateOnly(end)}`);
    } else {
      lines.push(`DTSTART:${formatDateUTC(start)}`);
      lines.push(`DTEND:${formatDateUTC(end)}`);
    }
    lines.push(`SUMMARY:${escapeText(event.title)}`);
    if (event.location) lines.push(`LOCATION:${escapeText(event.location)}`);
    if (event.notes) lines.push(`DESCRIPTION:${escapeText(event.notes)}`);
    if (event.updatedAt) lines.push(`LAST-MODIFIED:${formatDateUTC(event.updatedAt.toDate())}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
