import { useMemo, useState } from "react";
import Sheet from "../common/Sheet";
import FormatChip from "../common/FormatChip";
import { TextInput } from "../common/FormField";
import { useIdeas } from "../../hooks/useIdeas";
import { linkIdeaToEvent } from "../../hooks/useEvents";
import { updateIdea } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";
import type { CalendarEvent } from "../../types";

export default function LinkIdeaSheet({
  event,
  onClose,
}: {
  event: CalendarEvent;
  onClose: () => void;
}) {
  const profile = useAuthStore((s) => s.profile);
  const { data: ideas } = useIdeas();
  const [term, setTerm] = useState("");

  const candidates = useMemo(() => {
    const filtered = ideas.filter((i) => !event.ideaIds.includes(i.id));
    const byFormat = event.formats.length
      ? filtered.filter((i) => i.formats.some((f) => event.formats.includes(f)))
      : filtered;
    const pool = byFormat.length ? byFormat : filtered;
    const t = term.trim().toLowerCase();
    return (t ? pool.filter((i) => i.title.toLowerCase().includes(t)) : pool).slice(0, 30);
  }, [ideas, event, term]);

  async function link(ideaId: string, ideaTitle: string) {
    if (!profile) return;
    await linkIdeaToEvent(event.id, ideaId);
    await updateIdea(
      ideaId,
      { status: "scheduled" },
      { id: profile.id, initials: profile.initials },
      "scheduled",
      ideaTitle,
    );
    onClose();
  }

  return (
    <Sheet title="Link idea" onClose={onClose}>
      <TextInput
        autoFocus
        placeholder="Search ideas…"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="mb-3"
      />
      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto">
        {candidates.length === 0 && <p className="text-sm text-parchment/40">No matching ideas.</p>}
        {candidates.map((idea) => (
          <button
            key={idea.id}
            onClick={() => link(idea.id, idea.title)}
            className="flex w-full items-center justify-between gap-2 rounded-lg bg-fairway/50 px-3 py-2.5 text-left"
          >
            <span className="truncate text-sm text-parchment">{idea.title}</span>
            <div className="flex flex-none gap-1">{idea.formats.slice(0, 2).map((f) => <FormatChip key={f} format={f} />)}</div>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
