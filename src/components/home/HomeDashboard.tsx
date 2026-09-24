import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import FormatChip from "../common/FormatChip";
import InitialsChip from "../common/InitialsChip";
import StatusPill from "../common/StatusPill";
import WelcomeQuoteCard from "../welcome/WelcomeQuoteCard";
import { useIdeas } from "../../hooks/useIdeas";
import { useArticleSummaries } from "../../hooks/useArticleSummaries";
import { useUsers, useUserMap } from "../../hooks/useUsers";
import { shouldShowWelcome, markWelcomeShown } from "../../utils/welcome";
import { FORMATS, FORMAT_LABELS, IDEA_STATUS_LABELS, type Format } from "../../types";

type Pill = "all" | Format;

const PILLS: Pill[] = ["all", ...FORMATS];

function monthLabel(monthKey: string) {
  return format(new Date(`${monthKey}-01T00:00:00`), "MMMM yyyy");
}

export default function HomeDashboard() {
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome());
  const [pill, setPill] = useState<Pill>("all");

  const { data: ideas, loading } = useIdeas();
  const { data: users } = useUsers();
  const userMap = useUserMap(users);
  const articleSummaries = useArticleSummaries(ideas.filter((i) => i.formats.includes("article")).map((i) => i.id));

  const filtered = useMemo(() => {
    const active = ideas.filter((i) => i.status !== "parked");
    return pill === "all" ? active : active.filter((i) => i.formats.includes(pill));
  }, [ideas, pill]);

  if (showWelcome) {
    return (
      <WelcomeQuoteCard
        onDismiss={() => {
          markWelcomeShown();
          setShowWelcome(false);
        }}
      />
    );
  }

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {PILLS.map((p) => (
          <button
            key={p}
            onClick={() => setPill(p)}
            className={`flex-none rounded-full px-4 py-2 text-sm font-display uppercase tracking-wide transition ${
              pill === p ? "bg-fairway text-white" : "border border-ink/15 text-ink/60"
            }`}
          >
            {p === "all" ? "All" : FORMAT_LABELS[p]}
          </button>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <EmptyState title="No ideas here yet" hint="Tap + to capture your next one." />
      )}

      <div className="space-y-2">
        {filtered.map((idea) => {
          const owner = userMap.get(idea.ownerId);
          const isMailer = idea.formats.includes("article");
          const summary = articleSummaries.get(idea.id);

          return (
            <Card key={idea.id} onClick={() => navigate(`/ideas/${idea.id}`)}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{idea.title}</p>
                  {isMailer && idea.monthKey ? (
                    <p className="truncate text-xs text-ink/50">{monthLabel(idea.monthKey)}</p>
                  ) : (
                    idea.pitch && <p className="truncate text-xs text-ink/50">{idea.pitch}</p>
                  )}
                </div>
                <div className="flex flex-none gap-1">
                  {idea.formats.map((f) => (
                    <FormatChip key={f} format={f} />
                  ))}
                </div>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StatusPill
                    label={IDEA_STATUS_LABELS[idea.status]}
                    tone={idea.status === "parked" ? "parked" : "progress"}
                  />
                  {owner && <InitialsChip initials={owner.initials} colour={owner.colour} size="xs" />}
                </div>

                {isMailer && summary && summary.total > 0 ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-ink/40">
                      {summary.done}/{summary.total} articles
                    </span>
                    <div className="flex -space-x-1.5">
                      {summary.assignees.slice(0, 3).map((u) => (
                        <InitialsChip key={u.id} initials={u.initials} colour={u.colour} size="xs" />
                      ))}
                    </div>
                  </div>
                ) : isMailer ? (
                  <span className="text-[11px] text-ink/40">No articles yet</span>
                ) : null}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
