import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, MessageSquare } from "lucide-react";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import FormatChip from "../common/FormatChip";
import InitialsChip from "../common/InitialsChip";
import StatusPill from "../common/StatusPill";
import { useIdeas, toggleUpvote } from "../../hooks/useIdeas";
import { useUsers, useUserMap } from "../../hooks/useUsers";
import { useAuthStore } from "../../store/useAuthStore";
import { FORMATS, FORMAT_LABELS, IDEA_STATUS_LABELS, type Format, type IdeaStatus } from "../../types";

type Segment = "all" | Format;
type SortMode = "newest" | "active" | "upvoted";

export default function IdeasPage() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const { data: ideas, loading } = useIdeas();
  const { data: users } = useUsers();
  const userMap = useUserMap(users);

  const [segment, setSegment] = useState<Segment>("all");
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | "active">("active");
  const [sort, setSort] = useState<SortMode>("newest");

  const filtered = useMemo(() => {
    let list = ideas;
    if (segment !== "all") list = list.filter((i) => i.formats.includes(segment));
    if (statusFilter === "active") list = list.filter((i) => i.status !== "parked");
    else list = list.filter((i) => i.status === statusFilter);

    const sorted = [...list];
    if (sort === "newest") sorted.sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0));
    if (sort === "active") sorted.sort((a, b) => (b.updatedAt?.toMillis() ?? 0) - (a.updatedAt?.toMillis() ?? 0));
    if (sort === "upvoted") sorted.sort((a, b) => b.upvotes.length - a.upvotes.length);
    return sorted;
  }, [ideas, segment, statusFilter, sort]);

  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex gap-1 overflow-x-auto rounded-full bg-black/[0.04] p-1">
        {(["all", ...FORMATS] as Segment[]).map((s) => (
          <button
            key={s}
            onClick={() => setSegment(s)}
            className={`flex-none rounded-full px-3 py-1.5 text-xs font-display uppercase tracking-wide transition ${
              segment === s ? "bg-fairway text-white" : "text-ink/50"
            }`}
          >
            {s === "all" ? "All" : FORMAT_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as IdeaStatus | "active")}
          className="rounded-full border border-ink/12 bg-transparent px-3 py-1.5 text-xs text-ink/70"
        >
          <option value="active">Active</option>
          {Object.entries(IDEA_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="rounded-full border border-ink/12 bg-transparent px-3 py-1.5 text-xs text-ink/70"
        >
          <option value="newest">Newest</option>
          <option value="active">Recently active</option>
          <option value="upvoted">Most upvoted</option>
        </select>
      </div>

      {!loading && filtered.length === 0 && (
        <EmptyState title="No ideas here yet" hint="Tap + to capture your next one." />
      )}

      <div className="space-y-2">
        {filtered.map((idea) => {
          const owner = userMap.get(idea.ownerId);
          const upvoted = profile ? idea.upvotes.includes(profile.id) : false;
          return (
            <Card key={idea.id} onClick={() => navigate(`/ideas/${idea.id}`)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{idea.title}</p>
                  {idea.pitch && <p className="truncate text-xs text-ink/50">{idea.pitch}</p>}
                </div>
                <div className="flex flex-none gap-1">{idea.formats.map((f) => <FormatChip key={f} format={f} />)}</div>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusPill label={IDEA_STATUS_LABELS[idea.status]} tone={idea.status === "parked" ? "parked" : "progress"} />
                  {owner && <InitialsChip initials={owner.initials} colour={owner.colour} size="xs" />}
                  {idea.entryCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-ink/40">
                      <MessageSquare size={11} /> {idea.entryCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {idea.status === "scheduled" && (
                    <span className="text-[11px] text-ink/40">Scheduled</span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (profile) toggleUpvote(idea, profile.id);
                    }}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] transition ${
                      upvoted ? "bg-gold text-dark-green" : "border border-ink/12 text-ink/50"
                    }`}
                  >
                    <ArrowUp size={11} /> {idea.upvotes.length}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
