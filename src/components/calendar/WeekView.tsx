import { useMemo, useState } from "react";
import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import FormatChip from "../common/FormatChip";
import type { CalendarEvent } from "../../types";

export default function WeekView({
  events,
  onSelect,
}: {
  events: CalendarEvent[];
  onSelect: (id: string) => void;
}) {
  const [anchor, setAnchor] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(anchor, i)), [anchor]);

  return (
    <div className="px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setAnchor((a) => addDays(a, -7))} className="p-2 text-parchment/60">
          <ChevronLeft size={18} />
        </button>
        <p className="font-display text-xs uppercase tracking-widest text-parchment/60">
          {format(days[0], "d MMM")} – {format(days[6], "d MMM")}
        </p>
        <button onClick={() => setAnchor((a) => addDays(a, 7))} className="p-2 text-parchment/60">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="space-y-3">
        {days.map((day) => {
          const dayEvents = events
            .filter((e) => isSameDay(e.start.toDate(), day))
            .sort((a, b) => a.start.toMillis() - b.start.toMillis());
          return (
            <div key={day.toISOString()} className="flex gap-3">
              <div className="w-12 flex-none pt-1 text-center">
                <p className="text-[10px] uppercase text-parchment/40">{format(day, "EEE")}</p>
                <p
                  className={`font-display text-sm ${
                    isSameDay(day, new Date()) ? "text-gold" : "text-parchment"
                  }`}
                >
                  {format(day, "d")}
                </p>
              </div>
              <div className="min-w-0 flex-1 space-y-1.5 border-l border-white/10 pl-3">
                {dayEvents.length === 0 ? (
                  <p className="py-1.5 text-xs text-parchment/25">—</p>
                ) : (
                  dayEvents.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => onSelect(event.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg bg-fairway/50 px-2.5 py-1.5 text-left"
                    >
                      <span className="truncate text-xs text-parchment">
                        {!event.allDay && `${format(event.start.toDate(), "HH:mm")} · `}
                        {event.title}
                      </span>
                      {event.formats[0] && <FormatChip format={event.formats[0]} />}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
