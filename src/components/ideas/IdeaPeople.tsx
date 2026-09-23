import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrgs, usePeople } from "../../hooks/useNetwork";
import { updateIdea } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";
import type { Idea } from "../../types";

export default function IdeaPeople({ idea }: { idea: Idea }) {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const { data: orgs } = useOrgs();
  const { data: people } = usePeople();
  const [picking, setPicking] = useState<"org" | "person" | null>(null);

  const linkedOrgs = orgs.filter((o) => idea.linkedOrgIds?.includes(o.id));
  const linkedPeople = people.filter((p) => idea.linkedPersonIds?.includes(p.id));

  async function addOrg(orgId: string) {
    if (!profile) return;
    await updateIdea(
      idea.id,
      { linkedOrgIds: [...(idea.linkedOrgIds ?? []), orgId] },
      { id: profile.id, initials: profile.initials },
      "linked a partner",
      idea.title,
    );
    setPicking(null);
  }

  async function addPerson(personId: string) {
    if (!profile) return;
    await updateIdea(
      idea.id,
      { linkedPersonIds: [...(idea.linkedPersonIds ?? []), personId] },
      { id: profile.id, initials: profile.initials },
      "linked a person",
      idea.title,
    );
    setPicking(null);
  }

  if (linkedOrgs.length === 0 && linkedPeople.length === 0 && !picking) {
    return (
      <section className="mb-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xs uppercase tracking-widest text-ink/60">People</h3>
          <div className="flex gap-3">
            <button onClick={() => setPicking("org")} className="text-xs font-display uppercase text-fairway">
              + Partner
            </button>
            <button onClick={() => setPicking("person")} className="text-xs font-display uppercase text-fairway">
              + Person
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-xs uppercase tracking-widest text-ink/60">People</h3>
        <div className="flex gap-3">
          <button onClick={() => setPicking("org")} className="text-xs font-display uppercase text-fairway">
            + Partner
          </button>
          <button onClick={() => setPicking("person")} className="text-xs font-display uppercase text-fairway">
            + Person
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {linkedOrgs.map((org) => (
          <button
            key={org.id}
            onClick={() => navigate(`/network/orgs/${org.id}`)}
            className="rounded-full bg-black/[0.045] px-3 py-1 text-xs text-ink"
          >
            {org.name}
          </button>
        ))}
        {linkedPeople.map((person) => (
          <button
            key={person.id}
            onClick={() => navigate(`/network/people/${person.id}`)}
            className="rounded-full bg-black/[0.045] px-3 py-1 text-xs text-ink"
          >
            {person.name}
          </button>
        ))}
      </div>

      {picking === "org" && (
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {orgs
            .filter((o) => !idea.linkedOrgIds?.includes(o.id))
            .slice(0, 20)
            .map((o) => (
              <button
                key={o.id}
                onClick={() => addOrg(o.id)}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink/70 active:bg-black/[0.04]"
              >
                {o.name}
              </button>
            ))}
        </div>
      )}
      {picking === "person" && (
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {people
            .filter((p) => !idea.linkedPersonIds?.includes(p.id))
            .slice(0, 20)
            .map((p) => (
              <button
                key={p.id}
                onClick={() => addPerson(p.id)}
                className="block w-full rounded-lg px-2 py-1.5 text-left text-sm text-ink/70 active:bg-black/[0.04]"
              >
                {p.name}
              </button>
            ))}
        </div>
      )}
    </section>
  );
}
