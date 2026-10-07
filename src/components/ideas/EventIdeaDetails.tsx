import { useState } from "react";
import { format } from "date-fns";
import { Timestamp } from "firebase/firestore";
import { TextInput } from "../common/FormField";
import { updateIdea } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";
import type { Idea } from "../../types";

function toDateStr(ts?: Timestamp | null) {
  return ts ? format(ts.toDate(), "yyyy-MM-dd") : "";
}

function toTimeStr(ts?: Timestamp | null) {
  return ts ? format(ts.toDate(), "HH:mm") : "09:00";
}

export default function EventIdeaDetails({ idea }: { idea: Idea }) {
  const profile = useAuthStore((s) => s.profile);
  const [date, setDate] = useState(toDateStr(idea.eventDate));
  const [time, setTime] = useState(toTimeStr(idea.eventDate));
  const [location, setLocation] = useState(idea.eventLocation ?? "");

  async function save() {
    if (!profile) return;
    await updateIdea(
      idea.id,
      {
        eventDate: date ? Timestamp.fromDate(new Date(`${date}T${time || "00:00"}`)) : null,
        eventLocation: location,
      },
      { id: profile.id, initials: profile.initials },
      "updated the event details",
      idea.title,
    );
  }

  return (
    <section className="mb-5">
      <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-ink/60">
        Event details
      </h3>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} onBlur={save} />
        <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} onBlur={save} />
      </div>
      <TextInput
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        onBlur={save}
        placeholder="Fancourt, Studio 1…"
      />
    </section>
  );
}
