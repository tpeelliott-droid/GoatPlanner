import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUp, Trash2 } from "lucide-react";
import FormatTicks from "../common/FormatTicks";
import InitialsChip from "../common/InitialsChip";
import StatusPill from "../common/StatusPill";
import Button from "../common/Button";
import { TextArea, TextInput } from "../common/FormField";
import EntryFeed from "./EntryFeed";
import FormatAngles from "./FormatAngles";
import IdeaScheduling from "./IdeaScheduling";
import IdeaPeople from "./IdeaPeople";
import { toggleUpvote, updateIdea, useIdea } from "../../hooks/useIdeas";
import { useUsers, useUserMap } from "../../hooks/useUsers";
import { useAuthStore } from "../../store/useAuthStore";
import { IDEA_STATUS_LABELS, type Format, type IdeaStatus } from "../../types";

const STATUS_FLOW: IdeaStatus[] = ["new", "developing", "approved", "scheduled", "published"];

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const { idea, loading } = useIdea(id);
  const { data: users } = useUsers();
  const userMap = useUserMap(users);

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(idea?.title ?? "");
  const [pitch, setPitch] = useState(idea?.pitch ?? "");

  if (loading) return null;
  if (!idea) {
    return (
      <div className="px-4 py-8 text-center text-sm text-ink/50">
        Idea not found.{" "}
        <button onClick={() => navigate("/ideas")} className="text-fairway underline">
          Back to Ideas
        </button>
      </div>
    );
  }

  const owner = userMap.get(idea.ownerId);
  const upvoted = profile ? idea.upvotes.includes(profile.id) : false;
  const actor = profile ? { id: profile.id, initials: profile.initials } : null;

  async function saveHeader() {
    if (!actor) return;
    await updateIdea(idea!.id, { title: title.trim(), pitch: pitch.trim() }, actor, "edited the idea", title.trim());
    setEditingTitle(false);
  }

  async function handleFormatsChange(formats: Format[]) {
    if (!actor) return;
    await updateIdea(idea!.id, { formats }, actor, "changed formats", idea!.title);
  }

  async function handleStatusChange(status: IdeaStatus) {
    if (!actor || !idea) return;
    await updateIdea(idea.id, { status }, actor, `changed status to ${IDEA_STATUS_LABELS[status]}`, idea.title);
  }

  async function handleArchive() {
    if (!confirm("Park this idea? It'll stay searchable but leave the default list.")) return;
    await handleStatusChange("parked");
  }

  return (
    <div className="px-4 py-4">
      <button onClick={() => navigate(-1)} className="mb-3 flex items-center gap-1 text-sm text-ink/50">
        <ArrowLeft size={16} /> Back
      </button>

      <div className="mb-4">
        {editingTitle ? (
          <div className="space-y-2">
            <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
            <TextArea rows={2} value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="One-line pitch" />
            <div className="flex gap-2">
              <Button variant="accent" onClick={saveHeader}>
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditingTitle(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button className="text-left" onClick={() => setEditingTitle(true)}>
            <h2 className="font-display text-xl text-dark-green">{idea.title}</h2>
            {idea.pitch && <p className="mt-1 text-sm text-ink/60">{idea.pitch}</p>}
          </button>
        )}
      </div>

      <div className="mb-3">
        <FormatTicks value={idea.formats} onChange={handleFormatsChange} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {STATUS_FLOW.map((s) => (
          <button key={s} onClick={() => handleStatusChange(s)}>
            <StatusPill label={IDEA_STATUS_LABELS[s]} tone={s === idea.status ? "progress" : "neutral"} />
          </button>
        ))}
        {idea.status === "parked" && <StatusPill label="Parked" tone="parked" />}
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {owner && (
            <span className="flex items-center gap-1.5 text-xs text-ink/50">
              <InitialsChip initials={owner.initials} colour={owner.colour} size="xs" /> {owner.name}
            </span>
          )}
        </div>
        <button
          onClick={() => profile && toggleUpvote(idea, profile.id)}
          className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
            upvoted ? "bg-gold text-dark-green" : "border border-ink/15 text-ink/50"
          }`}
        >
          <ArrowUp size={12} /> {idea.upvotes.length}
        </button>
      </div>

      <FormatAngles idea={idea} />
      <IdeaScheduling idea={idea} />
      <EntryFeed ideaId={idea.id} />
      <IdeaPeople idea={idea} />

      {idea.status !== "parked" && (
        <button
          onClick={handleArchive}
          className="mt-6 flex items-center gap-1.5 text-xs text-ink/40"
        >
          <Trash2 size={13} /> Park this idea
        </button>
      )}
    </div>
  );
}
