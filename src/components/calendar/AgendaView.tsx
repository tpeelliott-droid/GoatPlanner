import { useMemo } from "react";
import { format, isSameDay, startOfDay } from "date-fns";
import EmptyState from "../common/EmptyState";
import FormatChip from "../common/FormatChip";
import StatusPill from "../common/StatusPill";
import type { CalendarEvent } from "../../types";
import { EVENT_TYPE_LABELS } from "../../types";

export default function AgendaView({
  events,
  onSelect,
}: {
  events: CalendarEvent[];
  onSelect: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = events
      .filter((e) => e.start.toDate() >= today || isSameDay(e.start.toDate(), today))
      .sort((a, b) => a.start.toMillis() - b.start.toMillis());

    const map = new Map<string, CalendarEvent[]>();
    for (const event of upcoming) {
      const key = format(event.start.toDate(), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return Array.from(map.entries());
  }, [events]);

  if (groups.length === 0) {
    return (
      <div className="px-4 py-6">
        <EmptyState title="Nothing scheduled yet" hint="Tap + to add a recording or event." />
      </div>
    );
  }

  return (
    <div className="divide-y divide-white/5 px-4">
      {groups.map(([key, dayEvents]) => (
        <div key={key} className="py-3">
          <p className="mb-2 font-display text-xs uppercase tracking-widest text-ink/50">
            {format(new Date(key), "EEEE d MMMM")}
          </p>
          <div className="space-y-2">
            {dayEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => onSelect(event.id)}
                className="flex w-full items-start justify-between gap-3 rounded-lg bg-black/[0.035] px-3 py-2.5 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{event.title}</p>
                  <p className="text-xs text-ink/50">
                    {event.allDay ? EVENT_TYPE_LABELS[event.type] : format(event.start.toDate(), "HH:mm")}
                    {event.location ? ` · ${event.location}` : ""}
                  </p>
                </div>
                <div className="flex flex-none flex-col items-end gap-1">
                  <div className="flex gap-1">{event.formats.map((f) => <FormatChip key={f} format={f} />)}</div>
                  {event.status === "cancelled" && <StatusPill label="Cancelled" tone="overdue" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
