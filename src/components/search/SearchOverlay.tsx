import { useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useIdeas } from "../../hooks/useIdeas";
import { useEvents } from "../../hooks/useEvents";
import { useOrgs, usePeople } from "../../hooks/useNetwork";
import FormatChip from "../common/FormatChip";
import { shortDate } from "../../utils/dates";

export default function SearchOverlay({ onClose }: { onClose: () => void }) {
  const [term, setTerm] = useState("");
  const navigate = useNavigate();
  const { data: ideas } = useIdeas();
  const { data: events } = useEvents();
  const { data: orgs } = useOrgs();
  const { data: people } = usePeople();

  const t = term.trim().toLowerCase();

  const ideaResults = useMemo(
    () => (t ? ideas.filter((i) => i.title.toLowerCase().includes(t)).slice(0, 6) : []),
    [ideas, t],
  );
  const eventResults = useMemo(
    () => (t ? events.filter((e) => e.title.toLowerCase().includes(t)).slice(0, 6) : []),
    [events, t],
  );
  const orgResults = useMemo(
    () => (t ? orgs.filter((o) => o.name.toLowerCase().includes(t)).slice(0, 6) : []),
    [orgs, t],
  );
  const peopleResults = useMemo(
    () => (t ? people.filter((p) => p.name.toLowerCase().includes(t)).slice(0, 6) : []),
    [people, t],
  );

  const noResults =
    t && !ideaResults.length && !eventResults.length && !orgResults.length && !peopleResults.length;

  function go(path: string) {
    navigate(path);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-dark-green safe-top safe-bottom">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <Search size={18} className="text-parchment/50" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search ideas, events, contacts…"
          className="flex-1 bg-transparent text-sm text-parchment placeholder:text-parchment/40 focus:outline-none"
        />
        <button onClick={onClose} aria-label="Close search" className="text-parchment/60">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!t && <p className="text-center text-sm text-parchment/40">Start typing to search.</p>}
        {noResults && <p className="text-center text-sm text-parchment/40">No matches for "{term}".</p>}

        {ideaResults.length > 0 && (
          <ResultSection title="Ideas">
            {ideaResults.map((idea) => (
              <button
                key={idea.id}
                onClick={() => go(`/ideas/${idea.id}`)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-parchment active:bg-white/10"
              >
                <span className="truncate">{idea.title}</span>
                <div className="flex gap-1">{idea.formats.slice(0, 2).map((f) => <FormatChip key={f} format={f} />)}</div>
              </button>
            ))}
          </ResultSection>
        )}

        {eventResults.length > 0 && (
          <ResultSection title="Calendar">
            {eventResults.map((event) => (
              <button
                key={event.id}
                onClick={() => go(`/calendar?event=${event.id}`)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-parchment active:bg-white/10"
              >
                <span className="truncate">{event.title}</span>
                <span className="text-xs text-parchment/50">{shortDate(event.start)}</span>
              </button>
            ))}
          </ResultSection>
        )}

        {orgResults.length > 0 && (
          <ResultSection title="Organisations">
            {orgResults.map((org) => (
              <button
                key={org.id}
                onClick={() => go(`/network/orgs/${org.id}`)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-parchment active:bg-white/10"
              >
                {org.name}
              </button>
            ))}
          </ResultSection>
        )}

        {peopleResults.length > 0 && (
          <ResultSection title="People">
            {peopleResults.map((person) => (
              <button
                key={person.id}
                onClick={() => go(`/network/people/${person.id}`)}
                className="w-full rounded-lg px-3 py-2.5 text-left text-sm text-parchment active:bg-white/10"
              >
                {person.name}
              </button>
            ))}
          </ResultSection>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <p className="mb-1 px-3 font-display text-[11px] uppercase tracking-widest text-parchment/40">
        {title}
      </p>
      {children}
    </div>
  );
}
