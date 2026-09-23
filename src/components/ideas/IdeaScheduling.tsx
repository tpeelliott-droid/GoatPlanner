import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEvents } from "../../hooks/useEvents";
import EventForm from "../calendar/EventForm";
import { friendlyDate } from "../../utils/dates";
import { EVENT_TYPE_LABELS, type Idea } from "../../types";

export default function IdeaScheduling({ idea }: { idea: Idea }) {
  const navigate = useNavigate();
  const { data: events } = useEvents();
  const [scheduling, setScheduling] = useState(false);

  const linked = events
    .filter((e) => e.ideaIds.includes(idea.id))
    .sort((a, b) => a.start.toMillis() - b.start.toMillis());

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-xs uppercase tracking-widest text-ink/60">Scheduling</h3>
        <button onClick={() => setScheduling(true)} className="text-xs font-display uppercase text-fairway">
          Schedule
        </button>
      </div>
      {linked.length === 0 ? (
        <p className="text-sm text-ink/40">Not scheduled yet.</p>
      ) : (
        <div className="space-y-1.5">
          {linked.map((event) => (
            <button
              key={event.id}
              onClick={() => navigate(`/calendar?event=${event.id}`)}
              className="flex w-full items-center justify-between rounded-lg bg-black/[0.035] px-3 py-2 text-left text-sm"
            >
              <span className="text-ink">
                {EVENT_TYPE_LABELS[event.type]}: {event.title}
              </span>
              <span className="text-xs text-ink/50">{friendlyDate(event.start)}</span>
            </button>
          ))}
        </div>
      )}

      {scheduling && (
        <EventForm
          presetIdeaId={idea.id}
          presetIdeaTitle={idea.title}
          presetFormats={idea.formats}
          onClose={() => setScheduling(false)}
          initialDate={new Date()}
        />
      )}
    </section>
  );
}
