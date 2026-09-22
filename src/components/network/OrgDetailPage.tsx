import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import StatusPill from "../common/StatusPill";
import InitialsChip from "../common/InitialsChip";
import { TextArea, Field } from "../common/FormField";
import InteractionForm from "./InteractionForm";
import { orgsCol } from "../../firebase/collections";
import { useOrgs, useInteractions, usePeople, updateOrg } from "../../hooks/useNetwork";
import { useIdeas } from "../../hooks/useIdeas";
import { useEvents } from "../../hooks/useEvents";
import { useUserMap, useUsers } from "../../hooks/useUsers";
import { useAuthStore } from "../../store/useAuthStore";
import { friendlyDate, shortDate } from "../../utils/dates";
import {
  ORG_CATEGORY_LABELS,
  PARTNERSHIP_STAGE_LABELS,
  PARTNERSHIP_STAGES,
  INTERACTION_TYPE_LABELS,
} from "../../types";

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const { data: orgs } = useOrgs();
  const { data: interactions } = useInteractions();
  const { data: people } = usePeople();
  const { data: ideas } = useIdeas();
  const { data: events } = useEvents();
  const { data: users } = useUsers();
  const userMap = useUserMap(users);
  const [loggingInteraction, setLoggingInteraction] = useState(false);
  const [dealDraft, setDealDraft] = useState("");

  const org = orgs.find((o) => o.id === id);
  if (!org) return null;

  const isAdmin = profile?.role === "admin";
  const owner = userMap.get(org.ownerId);
  const orgInteractions = interactions.filter((i) => i.parentType === "org" && i.parentId === org.id);
  const orgPeople = people.filter((p) => p.orgId === org.id);
  const linkedIdeas = ideas.filter((i) => i.linkedOrgIds?.includes(org.id));
  const linkedEvents = events.filter((e) => e.orgIds?.includes(org.id));

  const actor = profile ? { id: profile.id, initials: profile.initials } : null;

  async function setStage(stage: (typeof PARTNERSHIP_STAGES)[number]) {
    if (!actor) return;
    await updateOrg(org!.id, { stage }, actor, `moved to ${PARTNERSHIP_STAGE_LABELS[stage]}`, org!.name);
  }

  async function toggleWantToTalkTo() {
    await updateDoc(doc(orgsCol(), org!.id), { wantToTalkTo: !org!.wantToTalkTo });
  }

  async function saveDealNotes() {
    await updateDoc(doc(orgsCol(), org!.id), {
      dealNotes: { deliverables: dealDraft || org!.dealNotes?.deliverables || "" },
    });
  }

  return (
    <div className="px-4 py-4">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-parchment/60">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-3 flex items-start justify-between">
        <div>
          <h2 className="font-display text-xl text-parchment">{org.name}</h2>
          <p className="text-sm text-parchment/50">{ORG_CATEGORY_LABELS[org.category]}</p>
        </div>
        <button onClick={toggleWantToTalkTo} aria-label="Star for want-to-talk-to list">
          <Star size={20} className={org.wantToTalkTo ? "fill-gold text-gold" : "text-parchment/30"} />
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PARTNERSHIP_STAGES.map((s) => (
          <button key={s} onClick={() => setStage(s)}>
            <StatusPill label={PARTNERSHIP_STAGE_LABELS[s]} tone={s === org.stage ? "progress" : "neutral"} />
          </button>
        ))}
      </div>

      {owner && (
        <p className="mb-4 flex items-center gap-1.5 text-xs text-parchment/50">
          <InitialsChip initials={owner.initials} colour={owner.colour} size="xs" /> Owned by {owner.name}
        </p>
      )}

      {orgPeople.length > 0 && (
        <section className="mb-5">
          <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-parchment/60">People</h3>
          <div className="flex flex-wrap gap-2">
            {orgPeople.map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/network/people/${p.id}`)}
                className="rounded-full bg-fairway/60 px-3 py-1 text-xs text-parchment"
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {(linkedIdeas.length > 0 || linkedEvents.length > 0) && (
        <section className="mb-5">
          <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-parchment/60">
            Linked
          </h3>
          <div className="space-y-1.5">
            {linkedIdeas.map((idea) => (
              <button
                key={idea.id}
                onClick={() => navigate(`/ideas/${idea.id}`)}
                className="block w-full rounded-lg bg-fairway/50 px-3 py-2 text-left text-sm text-parchment"
              >
                💡 {idea.title}
              </button>
            ))}
            {linkedEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => navigate(`/calendar?event=${event.id}`)}
                className="flex w-full items-center justify-between rounded-lg bg-fairway/50 px-3 py-2 text-left text-sm text-parchment"
              >
                {event.title} <span className="text-xs text-parchment/50">{shortDate(event.start)}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="mb-5">
          <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-parchment/60">
            Deal notes <span className="text-parchment/30">(Admin only)</span>
          </h3>
          <Field label="Deliverables agreed">
            <TextArea
              rows={2}
              defaultValue={org.dealNotes?.deliverables ?? ""}
              onChange={(e) => setDealDraft(e.target.value)}
              onBlur={saveDealNotes}
              placeholder="2 podcast reads, 1 video integration…"
            />
          </Field>
        </section>
      )}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-display text-xs uppercase tracking-widest text-parchment/60">Interactions</h3>
          <button onClick={() => setLoggingInteraction(true)} className="text-xs font-display uppercase text-gold">
            + Log
          </button>
        </div>
        {orgInteractions.length === 0 ? (
          <p className="text-sm text-parchment/40">No interactions logged yet.</p>
        ) : (
          <div className="space-y-2">
            {orgInteractions.map((i) => (
              <div key={i.id} className="rounded-lg bg-fairway/40 px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-parchment/50">
                    {INTERACTION_TYPE_LABELS[i.type]}
                  </span>
                  <span className="text-[11px] text-parchment/40">{friendlyDate(i.date)}</span>
                </div>
                <p className="mt-1 text-sm text-parchment">{i.summary}</p>
                {i.nextStep && (
                  <p className="mt-1 text-xs text-gold">
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
          parentType="org"
          parentId={org.id}
          parentLabel={org.name}
          ownerId={org.ownerId}
          onClose={() => setLoggingInteraction(false)}
        />
      )}
    </div>
  );
}
