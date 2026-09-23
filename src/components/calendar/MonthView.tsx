import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { CalendarEvent } from "../../types";
import { FORMAT_COLOURS } from "../../utils/format";

export default function MonthView({
  events,
  onSelectDay,
  onSelectEvent,
}: {
  events: CalendarEvent[];
  onSelectDay: (date: Date) => void;
  onSelectEvent: (id: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState<Date | null>(null);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = format(event.start.toDate(), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }, [events]);

  const selectedEvents = selected ? eventsByDay.get(format(selected, "yyyy-MM-dd")) ?? [] : [];

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setMonth((m) => addMonths(m, -1))} className="p-2 text-ink/60">
          <ChevronLeft size={18} />
        </button>
        <p className="font-display text-sm uppercase tracking-widest text-ink">
          {format(month, "MMMM yyyy")}
        </p>
        <button onClick={() => setMonth((m) => addMonths(m, 1))} className="p-2 text-ink/60">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <p key={i} className="text-[10px] uppercase text-ink/40">
            {d}
          </p>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, new Date());
          const isSelected = selected && isSameDay(day, selected);
          return (
            <button
              key={key}
              onClick={() => {
                setSelected(day);
              }}
              onDoubleClick={() => onSelectDay(day)}
              className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg text-xs transition ${
                isSelected ? "bg-fairway text-white" : inMonth ? "text-ink" : "text-ink/25"
              }`}
            >
              <span className={isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-gold text-dark-green" : ""}>
                {format(day, "d")}
              </span>
              <span className="flex gap-0.5">
                {dayEvents.slice(0, 3).map((e, i) => (
                  <span
                    key={i}
                    className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: e.formats[0] ? FORMAT_COLOURS[e.formats[0]] : "#F4EFE4" }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-display text-xs uppercase tracking-widest text-ink/60">
              {format(selected, "EEEE d MMMM")}
            </p>
            <button
              onClick={() => onSelectDay(selected)}
              className="text-xs font-display uppercase tracking-wide text-fairway"
            >
              + Add
            </button>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-ink/40">Nothing scheduled.</p>
          ) : (
            <div className="space-y-1.5">
              {selectedEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onSelectEvent(event.id)}
                  className="flex w-full items-center justify-between rounded-lg bg-black/[0.035] px-3 py-2 text-left text-sm text-ink"
                >
                  {event.title}
                  <span className="text-xs text-ink/50">
                    {event.allDay ? "All day" : format(event.start.toDate(), "HH:mm")}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
