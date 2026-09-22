import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, Mail, MessageCircle, Star, Plus } from "lucide-react";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import StatusPill from "../common/StatusPill";
import InitialsChip from "../common/InitialsChip";
import NewOrgSheet from "./NewOrgSheet";
import { useOrgs, usePeople } from "../../hooks/useNetwork";
import { useUserMap, useUsers } from "../../hooks/useUsers";
import {
  ORG_CATEGORY_LABELS,
  PARTNERSHIP_STAGE_LABELS,
  PARTNERSHIP_STAGES,
  type OrgCategory,
} from "../../types";

type Tab = "orgs" | "people" | "wantToTalkTo";

export default function NetworkPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("orgs");
  const [category, setCategory] = useState<OrgCategory | "all">("all");
  const [stage, setStage] = useState<string>("all");
  const [newOrgOpen, setNewOrgOpen] = useState(false);

  const { data: orgs, loading: orgsLoading } = useOrgs();
  const { data: people, loading: peopleLoading } = usePeople();
  const { data: users } = useUsers();
  const userMap = useUserMap(users);

  const filteredOrgs = useMemo(() => {
    return orgs.filter((o) => {
      if (category !== "all" && o.category !== category) return false;
      if (stage !== "all" && o.stage !== stage) return false;
      return true;
    });
  }, [orgs, category, stage]);

  const wantToTalkTo = useMemo(() => orgs.filter((o) => o.wantToTalkTo), [orgs]);

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex gap-1 rounded-full bg-white/5 p-1">
        {(["orgs", "people", "wantToTalkTo"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-1.5 text-xs font-display uppercase tracking-wide transition ${
              tab === t ? "bg-fairway text-parchment" : "text-parchment/50"
            }`}
          >
            {t === "orgs" ? "Orgs" : t === "people" ? "People" : "Want to talk to"}
          </button>
        ))}
      </div>

      {tab === "orgs" && (
        <>
          <div className="mb-3 flex gap-2 overflow-x-auto">
            <button
              onClick={() => setNewOrgOpen(true)}
              className="flex flex-none items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-display uppercase text-dark-green"
            >
              <Plus size={13} /> Org
            </button>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as OrgCategory | "all")}
              className="rounded-full border border-parchment/15 bg-transparent px-3 py-1.5 text-xs text-parchment/70"
            >
              <option value="all">All categories</option>
              {Object.entries(ORG_CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="rounded-full border border-parchment/15 bg-transparent px-3 py-1.5 text-xs text-parchment/70"
            >
              <option value="all">All stages</option>
              {PARTNERSHIP_STAGES.map((s) => (
                <option key={s} value={s}>
                  {PARTNERSHIP_STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          {!orgsLoading && filteredOrgs.length === 0 && <EmptyState title="No organisations yet" />}
          <div className="space-y-2">
            {filteredOrgs.map((org) => {
              const owner = userMap.get(org.ownerId);
              return (
                <Card key={org.id} onClick={() => navigate(`/network/orgs/${org.id}`)}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-parchment">{org.name}</p>
                      <p className="text-xs text-parchment/50">{ORG_CATEGORY_LABELS[org.category]}</p>
                    </div>
                    <div className="flex flex-none items-center gap-2">
                      {owner && <InitialsChip initials={owner.initials} colour={owner.colour} size="xs" />}
                      <StatusPill label={PARTNERSHIP_STAGE_LABELS[org.stage]} tone="progress" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {tab === "people" && (
        <>
          {!peopleLoading && people.length === 0 && <EmptyState title="No contacts yet" />}
          <div className="space-y-2">
            {people.map((person) => (
              <Card key={person.id} onClick={() => navigate(`/network/people/${person.id}`)}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-parchment">
                      {person.starred && <Star size={12} className="mr-1 inline text-gold" />}
                      {person.name}
                    </p>
                    {person.role && <p className="truncate text-xs text-parchment/50">{person.role}</p>}
                  </div>
                  <div className="flex flex-none gap-1">
                    {person.phone && (
                      <a
                        href={`tel:${person.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-fairway/60 p-1.5 text-parchment"
                      >
                        <Phone size={13} />
                      </a>
                    )}
                    {person.phone && (
                      <a
                        href={`https://wa.me/${person.phone.replace(/[^0-9]/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-fairway/60 p-1.5 text-parchment"
                      >
                        <MessageCircle size={13} />
                      </a>
                    )}
                    {person.email && (
                      <a
                        href={`mailto:${person.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-full bg-fairway/60 p-1.5 text-parchment"
                      >
                        <Mail size={13} />
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {tab === "wantToTalkTo" && (
        <>
          {wantToTalkTo.length === 0 && (
            <EmptyState title="No shortlist yet" hint="Star a target org from its page to add it here." />
          )}
          <div className="space-y-2">
            {wantToTalkTo.map((org) => (
              <Card key={org.id} onClick={() => navigate(`/network/orgs/${org.id}`)}>
                <p className="text-sm font-medium text-parchment">{org.name}</p>
                {org.wantToTalkToReason && (
                  <p className="mt-1 text-xs text-parchment/50">{org.wantToTalkToReason}</p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {newOrgOpen && <NewOrgSheet onClose={() => setNewOrgOpen(false)} />}
    </div>
  );
}
