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

function toDateStr(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function toTimeStr(date: Date) {
  return format(date, "HH:mm");
}

function combine(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr || "00:00"}`);
}

function addMinutesToTime(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = ((h * 60 + m + minutes) % (24 * 60) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
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
  const [startDate, setStartDate] = useState(toDateStr(start0));
  const [startTime, setStartTime] = useState(toTimeStr(start0));
  const [endDate, setEndDate] = useState(toDateStr(end0));
  const [endTime, setEndTime] = useState(toTimeStr(end0));
  const [location, setLocation] = useState(existing?.location ?? "");
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [attendeeIds, setAttendeeIds] = useState<string[]>(existing?.attendeeIds ?? (profile ? [profile.id] : []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleStartDateChange(value: string) {
    setStartDate(value);
    // The end date always follows the start date — most events are same-day,
    // and this is the one field a user is most likely to forget to update.
    setEndDate(value);
  }

  function handleTypeChange(nextType: EventType) {
    setType(nextType);
    if (!existing) {
      const dur = DEFAULT_DURATION_MIN[nextType];
      setAllDay(dur === 0);
      if (dur > 0) setEndTime(addMinutesToTime(startTime, dur));
    }
  }

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  const clashes = useMemo(() => {
    if (allDay) return [];
    const startDateTime = combine(startDate, startTime);
    const endDateTime = combine(endDate, endTime);
    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime())) return [];
    return findClashes(events, { start: startDateTime, end: endDateTime, attendeeIds, excludeId: existing?.id });
  }, [events, startDate, startTime, endDate, endTime, attendeeIds, allDay, existing?.id]);

  async function handleSave() {
    if (!profile) return;
    if (!title.trim()) {
      setError("Give the event a title.");
      return;
    }
    const startDateTime = combine(startDate, allDay ? "00:00" : startTime);
    const endDateTime = allDay ? startDateTime : combine(endDate, endTime);
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
            start: startDateTime,
            end: endDateTime,
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
                type === t ? "bg-fairway text-white" : "border border-ink/15 text-ink/60"
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
          className="h-4 w-4 accent-fairway"
        />
        <label htmlFor="allday" className="text-sm text-ink/80">
          All day
        </label>
      </div>

      {allDay ? (
        <Field label="Date">
          <TextInput type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
        </Field>
      ) : (
        <>
          <Field label="Starts">
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} />
              <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          </Field>
          <Field label="Ends">
            <div className="grid grid-cols-2 gap-2">
              <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </Field>
        </>
      )}

      {clashes.length > 0 && (
        <div className="mb-4 rounded-lg border border-rust/40 bg-rust/[0.07] px-3 py-2 text-xs text-rust">
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
                attendeeIds.includes(u.id) ? "bg-fairway text-white" : "border border-ink/12 text-ink"
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
