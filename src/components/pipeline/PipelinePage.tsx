import { useMemo, useState } from "react";
import Card from "../common/Card";
import FormatChip from "../common/FormatChip";
import InitialsChip from "../common/InitialsChip";
import StatusPill from "../common/StatusPill";
import ContentItemSheet from "./ContentItemSheet";
import { useContentItems } from "../../hooks/useContentItems";
import { useIdeas } from "../../hooks/useIdeas";
import { useUsers, useUserMap } from "../../hooks/useUsers";
import { FORMATS, FORMAT_LABELS, PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type ContentItem, type Format } from "../../types";
import { isOverdue, shortDate } from "../../utils/dates";

export default function PipelinePage() {
  const { data: contentItems } = useContentItems();
  const { data: ideas } = useIdeas();
  const { data: users } = useUsers();
  const userMap = useUserMap(users);
  const [formatFilter, setFormatFilter] = useState<Format | "all">("all");
  const [selected, setSelected] = useState<ContentItem | null>(null);

  const ideaMap = useMemo(() => new Map(ideas.map((i) => [i.id, i])), [ideas]);

  const filtered = useMemo(
    () => (formatFilter === "all" ? contentItems : contentItems.filter((c) => c.format === formatFilter)),
    [contentItems, formatFilter],
  );

  const columns = useMemo(() => {
    const map = new Map<string, ContentItem[]>(PIPELINE_STAGES.map((s) => [s, []]));
    for (const item of filtered) map.get(item.stage)?.push(item);
    return map;
  }, [filtered]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 overflow-x-auto border-b border-white/10 px-4 py-3">
        <FilterChip active={formatFilter === "all"} onClick={() => setFormatFilter("all")}>
          All
        </FilterChip>
        {FORMATS.map((f) => (
          <FilterChip key={f} active={formatFilter === f} onClick={() => setFormatFilter(f)}>
            {FORMAT_LABELS[f]}
          </FilterChip>
        ))}
      </div>

      <div className="flex flex-1 gap-3 overflow-x-auto px-4 py-4">
        {PIPELINE_STAGES.map((stage) => {
          const items = columns.get(stage) ?? [];
          return (
            <div key={stage} className="w-64 flex-none">
              <p className="mb-2 flex items-center justify-between font-display text-xs uppercase tracking-widest text-parchment/60">
                {PIPELINE_STAGE_LABELS[stage]} <span className="text-parchment/30">{items.length}</span>
              </p>
              <div className="space-y-2">
                {items.map((item) => {
                  const idea = ideaMap.get(item.ideaId);
                  const assignee = item.assigneeId ? userMap.get(item.assigneeId) : undefined;
                  const doneCount = item.checklist.filter((c) => c.done).length;
                  return (
                    <Card key={item.id} onClick={() => setSelected(item)}>
                      <div className="mb-1.5 flex items-start justify-between gap-2">
                        <FormatChip format={item.format} />
                        {item.dueDate && (
                          <StatusPill
                            label={shortDate(item.dueDate)}
                            tone={isOverdue(item.dueDate) ? "overdue" : "neutral"}
                          />
                        )}
                      </div>
                      <p className="truncate text-sm text-parchment">{idea?.title ?? "Untitled"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-parchment/40">
                          {doneCount}/{item.checklist.length} done
                        </span>
                        {assignee && <InitialsChip initials={assignee.initials} colour={assignee.colour} size="xs" />}
                      </div>
                    </Card>
                  );
                })}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-parchment/10 px-3 py-4 text-center text-xs text-parchment/25">
                    Empty
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <ContentItemSheet
          item={selected}
          idea={ideaMap.get(selected.ideaId)}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-none rounded-full px-3 py-1 text-xs transition ${
        active ? "bg-fairway text-parchment" : "border border-parchment/15 text-parchment/60"
      }`}
    >
      {children}
    </button>
  );
}
