import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle, Phone, Star } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import InteractionForm from "./InteractionForm";
import { peopleCol } from "../../firebase/collections";
import { useInteractions, useOrgs, usePeople } from "../../hooks/useNetwork";
import { useIdeas } from "../../hooks/useIdeas";
import { friendlyDate, shortDate } from "../../utils/dates";
import { INTERACTION_TYPE_LABELS } from "../../types";

export default function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: people } = usePeople();
  const { data: orgs } = useOrgs();
  const { data: interactions } = useInteractions();
  const { data: ideas } = useIdeas();
  const [loggingInteraction, setLoggingInteraction] = useState(false);

  const person = people.find((p) => p.id === id);
  if (!person) return null;

  const org = orgs.find((o) => o.id === person.orgId);
  const personInteractions = interactions.filter((i) => i.parentType === "person" && i.parentId === person.id);
  const linkedIdeas = ideas.filter((i) => i.linkedPersonIds?.includes(person.id));

  async function toggleStar() {
    await updateDoc(doc(peopleCol(), person!.id), { starred: !person!.starred });
  }

  return (
    <div className="px-4 py-4">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink/60">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="font-display text-xl text-ink">{person.name}</h2>
          <p className="text-sm text-ink/50">
            {person.role}
            {org && (
              <>
                {" · "}
                <button onClick={() => navigate(`/network/orgs/${org.id}`)} className="underline">
                  {org.name}
                </button>
              </>
            )}
          </p>
        </div>
        <button onClick={toggleStar} aria-label="Star contact">
          <Star size={20} className={person.starred ? "fill-gold text-gold" : "text-ink/30"} />
        </button>
      </div>

      <div className="mb-5 flex gap-2">
        {person.phone && (
          <a href={`tel:${person.phone}`} className="flex items-center gap-1.5 rounded-full bg-black/[0.045] px-3 py-1.5 text-xs text-ink">
            <Phone size={13} /> Call
          </a>
        )}
        {person.phone && (
          <a
            href={`https://wa.me/${person.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-full bg-black/[0.045] px-3 py-1.5 text-xs text-ink"
          >
            <MessageCircle size={13} /> WhatsApp
          </a>
        )}
        {person.email && (
          <a href={`mailto:${person.email}`} className="flex items-center gap-1.5 rounded-full bg-black/[0.045] px-3 py-1.5 text-xs text-ink">
            <Mail size={13} /> Email
          </a>
        )}
      </div>

      {person.howWeKnowThem && (
        <p className="mb-4 text-sm text-ink/60">{person.howWeKnowThem}</p>
      )}

      {linkedIdeas.length > 0 && (
        <section className="mb-5">
          <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-ink/60">
            Linked ideas
          </h3>
          <div className="space-y-1.5">
            {linkedIdeas.map((idea) => (
              <button
                key={idea.id}
                onClick={() => navigate(`/ideas/${idea.id}`)}
                className="block w-full rounded-lg bg-black/[0.035] px-3 py-2 text-left text-sm text-ink"
              >
                {idea.title}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xs uppercase tracking-widest text-ink/60">Interactions</h3>
          <button onClick={() => setLoggingInteraction(true)} className="text-xs font-display uppercase text-fairway">
            + Log
          </button>
        </div>
        {personInteractions.length === 0 ? (
          <p className="text-sm text-ink/40">No interactions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {personInteractions.map((i) => (
              <div key={i.id} className="rounded-lg bg-black/[0.03] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-ink/50">
                    {INTERACTION_TYPE_LABELS[i.type]}
                  </span>
                  <span className="text-[11px] text-ink/40">{friendlyDate(i.date)}</span>
                </div>
                <p className="mt-1 text-sm text-ink">{i.summary}</p>
                {i.nextStep && (
                  <p className="mt-1 text-xs text-fairway">
                    Next: {i.nextStep} {i.nextStepDate && `· ${shortDate(i.nextStepDate)}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {loggingInteraction && (
        <InteractionForm
          parentType="person"
          parentId={person.id}
          parentLabel={person.name}
          ownerId={person.ownerId}
          onClose={() => setLoggingInteraction(false)}
        />
      )}
    </div>
  );
}
