import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format, isSameDay, startOfDay } from "date-fns";
import { MapPin } from "lucide-react";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import { useEvents } from "../../hooks/useEvents";

export default function HomeEventsList() {
  const navigate = useNavigate();
  const { data: events, loading } = useEvents();

  const upcoming = useMemo(() => {
    const today = startOfDay(new Date());
    return events
      .filter((e) => e.type === "event" && (e.start.toDate() >= today || isSameDay(e.start.toDate(), today)))
      .sort((a, b) => a.start.toMillis() - b.start.toMillis());
  }, [events]);

  if (!loading && upcoming.length === 0) {
    return <EmptyState title="No events scheduled" hint="Tap + to add a golf day or tournament." />;
  }

  return (
    <div className="space-y-2">
      {upcoming.map((event) => (
        <Card key={event.id} onClick={() => navigate(`/calendar?event=${event.id}`)}>
          <p className="text-sm font-medium text-ink">{event.title}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/50">
            {event.allDay
              ? format(event.start.toDate(), "EEEE d MMMM")
              : format(event.start.toDate(), "EEEE d MMMM · HH:mm")}
            {event.location && (
              <>
                <span className="text-ink/30">·</span>
                <MapPin size={11} /> {event.location}
              </>
            )}
          </p>
        </Card>
      ))}
    </div>
  );
}
