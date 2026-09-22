import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Trash2 } from "lucide-react";
import Sheet from "../common/Sheet";
import FormatChip from "../common/FormatChip";
import InitialsChip from "../common/InitialsChip";
import StatusPill from "../common/StatusPill";
import Button from "../common/Button";
import EventForm from "./EventForm";
import LinkIdeaSheet from "./LinkIdeaSheet";
import { deleteEvent, unlinkIdeaFromEvent, updateEvent } from "../../hooks/useEvents";
import { useIdeas } from "../../hooks/useIdeas";
import { useUsers, useUserMap } from "../../hooks/useUsers";
import { useAuthStore } from "../../store/useAuthStore";
import { friendlyDate } from "../../utils/dates";
import type { CalendarEvent, EventStatus } from "../../types";

const STATUSES: EventStatus[] = ["tentative", "confirmed", "done", "cancelled"];

export default function EventDetailSheet({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const { data: users } = useUsers();
  const { data: ideas } = useIdeas();
  const userMap = useUserMap(users);
  const [editing, setEditing] = useState(false);
  const [linkingIdea, setLinkingIdea] = useState(false);

  const linkedIdeas = ideas.filter((i) => event.ideaIds.includes(i.id));

  async function handleStatusChange(status: EventStatus) {
    if (!profile) return;
    await updateEvent(
      event.id,
      { status },
      { id: profile.id, initials: profile.initials },
      `set status to ${status}`,
      event.title,
    );
  }

  async function handleDelete() {
    if (!confirm("Delete this event? Linked ideas will return to Approved if this was their only date.")) return;
    await deleteEvent(event.id);
    onClose();
  }

  if (editing) {
    return <EventForm existing={event} onClose={() => setEditing(false)} />;
  }

  return (
    <Sheet title={event.title} onClose={onClose}>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {event.formats.map((f) => (
          <FormatChip key={f} format={f} size="md" />
        ))}
      </div>

      <p className="mb-1 text-sm text-parchment">{friendlyDate(event.start)}</p>
      {event.location && (
        <p className="mb-3 flex items-center gap-1.5 text-sm text-parchment/60">
          <MapPin size={14} /> {event.location}
        </p>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => handleStatusChange(s)}>
            <StatusPill
              label={s}
              tone={s === event.status ? (s === "cancelled" ? "overdue" : "progress") : "neutral"}
            />
          </button>
        ))}
      </div>

      {event.attendeeIds.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {event.attendeeIds.map((id) => {
            const u = userMap.get(id);
            return u ? <InitialsChip key={id} initials={u.initials} colour={u.colour} title={u.name} /> : null;
          })}
        </div>
      )}

      {event.notes && <p className="mb-4 whitespace-pre-wrap text-sm text-parchment/70">{event.notes}</p>}

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-xs uppercase tracking-widest text-parchment/50">Linked ideas</p>
          <button onClick={() => setLinkingIdea(true)} className="text-xs font-display uppercase text-gold">
            + Link idea
          </button>
        </div>
        {linkedIdeas.length === 0 ? (
          <p className="text-sm text-parchment/40">No ideas linked yet.</p>
        ) : (
          <div className="space-y-1.5">
            {linkedIdeas.map((idea) => (
              <div key={idea.id} className="flex items-center justify-between rounded-lg bg-fairway/50 px-3 py-2">
                <button onClick={() => navigate(`/ideas/${idea.id}`)} className="truncate text-left text-sm text-parchment">
                  {idea.title}
                </button>
                <button
                  onClick={() => unlinkIdeaFromEvent(event.id, idea.id)}
                  className="text-xs text-parchment/40"
                >
                  Unlink
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" full onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button variant="destructive" onClick={handleDelete} aria-label="Delete event">
          <Trash2 size={16} />
        </Button>
      </div>

      {linkingIdea && (
        <LinkIdeaSheet
          event={event}
          onClose={() => setLinkingIdea(false)}
        />
      )}
    </Sheet>
  );
}
