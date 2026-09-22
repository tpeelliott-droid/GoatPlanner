import { useMemo, useState } from "react";
import { format } from "date-fns";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field, TextArea, TextInput } from "../common/FormField";
import FormatTicks from "../common/FormatTicks";
import InitialsChip from "../common/InitialsChip";
import { createEvent, findClashes, updateEvent, useEvents } from "../../hooks/useEvents";
import { updateIdea } from "../../hooks/useIdeas";
import { useUsers } from "../../hooks/useUsers";
import { useAuthStore } from "../../store/useAuthStore";
import type { CalendarEvent, EventType, Format } from "../../types";
import { EVENT_TYPE_LABELS } from "../../types";

const EVENT_TYPES: EventType[] = ["recording", "publish", "event", "meeting", "deadline"];

const DEFAULT_DURATION_MIN: Record<EventType, number> = {
  recording: 120,
  publish: 0,
  event: 0,
  meeting: 60,
  deadline: 0,
};

function toLocalInputValue(date: Date) {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export default function EventForm({
  onClose,
  initialDate,
  existing,
  presetIdeaId,
  presetIdeaTitle,
  presetFormats,
  onSaved,
}: {
  onClose: () => void;
  initialDate?: Date;
  existing?: CalendarEvent;
  presetIdeaId?: string;
  presetIdeaTitle?: string;
  presetFormats?: Format[];
  onSaved?: (id: string) => void;
}) {
  const profile = useAuthStore((s) => s.profile);
  const { data: users } = useUsers();
  const { data: events } = useEvents();

  const start0 = existing ? existing.start.toDate() : initialDate ?? new Date();
  const end0 = existing
    ? existing.end.toDate()
    : new Date(start0.getTime() + DEFAULT_DURATION_MIN.meeting * 60000);

  const [title, setTitle] = useState(existing?.title ?? presetIdeaTitle ?? "");
  const [type, setType] = useState<EventType>(existing?.type ?? "recording");
  const [formats, setFormats] = useState<Format[]>(existing?.formats ?? presetFormats ?? []);
  const [allDay, setAllDay] = useState(existing?.allDay ?? false);
  const [start, setStart] = useState(toLocalInputValue(start0));
  const [end, setEnd] = useState(toLocalInputValue(end0));
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [attendeeIds, setAttendeeIds] = useState<string[]>(existing?.attendeeIds ?? (profile ? [profile.id] : []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTypeChange(nextType: EventType) {
    setType(nextType);
    if (!existing) {
      const s = new Date(start);
      const dur = DEFAULT_DURATION_MIN[nextType];
      setAllDay(dur === 0);
      if (dur > 0) setEnd(toLocalInputValue(new Date(s.getTime() + dur * 60000)));
    }
  }

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  const clashes = useMemo(() => {
    if (allDay) return [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return [];
    return findClashes(events, { start: startDate, end: endDate, attendeeIds, excludeId: existing?.id });
  }, [events, start, end, attendeeIds, allDay, existing?.id]);

  async function handleSave() {
    if (!profile) return;
    if (!title.trim()) {
      setError("Give the event a title.");
      return;
    }
    const startDate = new Date(start);
    const endDate = allDay ? startDate : new Date(end);
    setSaving(true);
    setError(null);
    try {
      if (existing) {
        await updateEvent(
          existing.id,
          { title: title.trim(), type, formats, allDay, location, notes, attendeeIds },
          { id: profile.id, initials: profile.initials },
          "updated the event",
          title.trim(),
        );
        onSaved?.(existing.id);
      } else {
        const id = await createEvent(
          {
            title: title.trim(),
            type,
            formats,
            start: startDate,
            end: endDate,
            allDay,
            location,
            notes,
            attendeeIds,
            ideaIds: presetIdeaId ? [presetIdeaId] : [],
            createdBy: profile.id,
          },
          { id: profile.id, initials: profile.initials },
        );
        if (presetIdeaId) {
          await updateIdea(
            presetIdeaId,
            { status: "scheduled" },
            { id: profile.id, initials: profile.initials },
            "scheduled",
            title.trim(),
          );
        }
        onSaved?.(id);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the event");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title={existing ? "Edit event" : "New event"} onClose={onClose}>
      <Field label="Title">
        <TextInput
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Podcast ep. with a guest"
        />
      </Field>

      <Field label="Type">
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className={`rounded-full px-3 py-1.5 text-xs font-display uppercase tracking-wide transition ${
                type === t ? "bg-fairway text-parchment" : "border border-parchment/20 text-parchment/60"
              }`}
            >
              {EVENT_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Formats">
        <FormatTicks value={formats} onChange={setFormats} />
      </Field>

      <div className="mb-4 flex items-center gap-2">
        <input
          id="allday"
          type="checkbox"
          checked={allDay}
          onChange={(e) => setAllDay(e.target.checked)}
          className="h-4 w-4 accent-gold"
        />
        <label htmlFor="allday" className="text-sm text-parchment/80">
          All day
        </label>
      </div>

      <Field label={allDay ? "Date" : "Starts"}>
        <TextInput
          type={allDay ? "date" : "datetime-local"}
          value={allDay ? start.slice(0, 10) : start}
          onChange={(e) => setStart(e.target.value)}
        />
      </Field>
      {!allDay && (
        <Field label="Ends">
          <TextInput type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      )}

      {clashes.length > 0 && (
        <div className="mb-4 rounded-lg border border-rust/50 bg-rust/10 px-3 py-2 text-xs text-rust">
          Clash: overlaps with "{clashes[0].title}"
          {clashes.length > 1 ? ` and ${clashes.length - 1} more` : ""}.
        </div>
      )}

      <Field label="Location">
        <TextInput
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Fancourt, Studio 1…"
        />
      </Field>

      <Field label="Attendees">
        <div className="flex flex-wrap gap-2">
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => toggleAttendee(u.id)}
              className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs transition ${
                attendeeIds.includes(u.id) ? "bg-fairway" : "border border-parchment/15"
              }`}
            >
              <InitialsChip initials={u.initials} colour={u.colour} size="xs" />
              {u.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Notes">
        <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Kit list, questions to prep…" />
      </Field>

      {error && <p className="mb-3 text-sm text-rust">{error}</p>}
      <Button variant="accent" full onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : existing ? "Save changes" : "Save event"}
      </Button>
    </Sheet>
  );
}

