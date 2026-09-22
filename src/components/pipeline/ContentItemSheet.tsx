import { useNavigate } from "react-router-dom";
import { Timestamp } from "firebase/firestore";
import Sheet from "../common/Sheet";
import FormatChip from "../common/FormatChip";
import StatusPill from "../common/StatusPill";
import { TextInput } from "../common/FormField";
import { updateContentItem, updateContentItemStage } from "../../hooks/useContentItems";
import { useUsers } from "../../hooks/useUsers";
import { useOrgs } from "../../hooks/useNetwork";
import { useAuthStore } from "../../store/useAuthStore";
import { PIPELINE_STAGES, PIPELINE_STAGE_LABELS, type ContentItem, type Idea } from "../../types";

export default function ContentItemSheet({
  item,
  idea,
  onClose,
}: {
  item: ContentItem;
  idea: Idea | undefined;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const { data: users } = useUsers();
  const { data: orgs } = useOrgs();
  const label = idea ? `${idea.title} (${item.format})` : item.format;

  async function setStage(stage: (typeof PIPELINE_STAGES)[number]) {
    if (!profile) return;
    await updateContentItemStage(item.id, stage, { id: profile.id, initials: profile.initials }, label);
  }

  async function toggleChecklistItem(id: string) {
    const checklist = item.checklist.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
    await updateContentItem(item.id, { checklist });
  }

  async function setAssignee(assigneeId: string) {
    await updateContentItem(item.id, { assigneeId: assigneeId || undefined });
  }

  async function setDueDate(value: string) {
    await updateContentItem(item.id, { dueDate: value ? Timestamp.fromDate(new Date(value)) : undefined });
  }

  function addSponsorDeliverable() {
    const description = prompt("Deliverable (e.g. 2 podcast reads)");
    if (!description) return;
    const orgId = orgs[0]?.id;
    if (!orgId) {
      alert("Add an organisation in Network first.");
      return;
    }
    updateContentItem(item.id, {
      sponsorDeliverables: [...(item.sponsorDeliverables ?? []), { orgId, description, done: false }],
    });
  }

  return (
    <Sheet title="Pipeline card" onClose={onClose}>
      <div className="mb-3 flex items-center gap-2">
        <FormatChip format={item.format} size="md" />
        {idea && (
          <button onClick={() => navigate(`/ideas/${idea.id}`)} className="truncate text-sm text-gold underline">
            {idea.title}
          </button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {PIPELINE_STAGES.map((stage) => (
          <button key={stage} onClick={() => setStage(stage)}>
            <StatusPill label={PIPELINE_STAGE_LABELS[stage]} tone={stage === item.stage ? "progress" : "neutral"} />
          </button>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <p className="mb-1 text-xs text-parchment/50">Assignee</p>
          <select
            value={item.assigneeId ?? ""}
            onChange={(e) => setAssignee(e.target.value)}
            className="w-full rounded-lg border border-parchment/15 bg-white/5 px-2 py-2 text-sm text-parchment"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-xs text-parchment/50">Due date</p>
          <TextInput
            type="date"
            defaultValue={item.dueDate ? item.dueDate.toDate().toISOString().slice(0, 10) : ""}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs uppercase tracking-widest text-parchment/50">Checklist</p>
        <div className="space-y-1.5">
          {item.checklist.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleChecklistItem(c.id)}
              className="flex w-full items-center gap-2 text-left text-sm"
            >
              <span
                className={`flex h-4 w-4 flex-none items-center justify-center rounded border ${
                  c.done ? "border-gold bg-gold text-dark-green" : "border-parchment/30"
                }`}
              >
                {c.done && "✓"}
              </span>
              <span className={c.done ? "text-parchment/40 line-through" : "text-parchment"}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-widest text-parchment/50">Sponsor deliverables</p>
          <button onClick={addSponsorDeliverable} className="text-xs font-display uppercase text-gold">
            + Add
          </button>
        </div>
        {(item.sponsorDeliverables ?? []).length === 0 ? (
          <p className="text-sm text-parchment/40">None tracked.</p>
        ) : (
          <div className="space-y-1">
            {item.sponsorDeliverables!.map((d, i) => (
              <p key={i} className="text-sm text-parchment/70">
                {orgs.find((o) => o.id === d.orgId)?.name ?? "Unknown"}: {d.description}
              </p>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}
