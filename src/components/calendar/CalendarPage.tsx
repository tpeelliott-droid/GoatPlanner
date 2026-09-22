import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import AgendaView from "./AgendaView";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import EventForm from "./EventForm";
import EventDetailSheet from "./EventDetailSheet";
import { useEvents } from "../../hooks/useEvents";
import { FORMATS, FORMAT_LABELS, type Format } from "../../types";
import { FORMAT_COLOURS } from "../../utils/format";
import { useAuthStore } from "../../store/useAuthStore";

type ViewMode = "agenda" | "week" | "month";

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>("agenda");
  const [formatFilter, setFormatFilter] = useState<Format | "all">("all");
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createDate, setCreateDate] = useState<Date | undefined>(undefined);
  const [searchParams, setSearchParams] = useSearchParams();
  const profile = useAuthStore((s) => s.profile);

  const { data: events, loading } = useEvents();

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (formatFilter !== "all" && !e.formats.includes(formatFilter)) return false;
      if (myEventsOnly && profile && !e.attendeeIds.includes(profile.id)) return false;
      return true;
    });
  }, [events, formatFilter, myEventsOnly, profile]);

  const selectedEventId = searchParams.get("event");
  const selectedEvent = selectedEventId ? events.find((e) => e.id === selectedEventId) : undefined;

  return (
    <div className="flex h-full flex-col">
      <div className="space-y-3 border-b border-white/10 px-4 py-3">
        <div className="flex gap-1 rounded-full bg-white/5 p-1">
          {(["agenda", "week", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 rounded-full py-1.5 text-xs font-display uppercase tracking-wide transition ${
                view === v ? "bg-fairway text-parchment" : "text-parchment/50"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={formatFilter === "all"} onClick={() => setFormatFilter("all")}>
            All
          </FilterChip>
          {FORMATS.map((f) => (
            <FilterChip
              key={f}
              active={formatFilter === f}
              onClick={() => setFormatFilter(f)}
              dot={FORMAT_COLOURS[f]}
            >
              {FORMAT_LABELS[f]}
            </FilterChip>
          ))}
          <FilterChip active={myEventsOnly} onClick={() => setMyEventsOnly((v) => !v)}>
            My events
          </FilterChip>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!loading && view === "agenda" && (
          <AgendaView events={filtered} onSelect={(id) => setSearchParams({ event: id })} />
        )}
        {!loading && view === "week" && (
          <WeekView events={filtered} onSelect={(id) => setSearchParams({ event: id })} />
        )}
        {!loading && view === "month" && (
          <MonthView
            events={filtered}
            onSelectDay={(date) => {
              setCreateDate(date);
              setCreateOpen(true);
            }}
            onSelectEvent={(id) => setSearchParams({ event: id })}
          />
        )}
      </div>

      {createOpen && (
        <EventForm initialDate={createDate} onClose={() => setCreateOpen(false)} />
      )}
      {selectedEvent && (
        <EventDetailSheet event={selectedEvent} onClose={() => setSearchParams({})} />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  dot,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs transition ${
        active ? "bg-fairway text-parchment" : "border border-parchment/15 text-parchment/60"
      }`}
    >
      {dot && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />}
      {children}
    </button>
  );
}
