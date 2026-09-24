import { useState } from "react";
import { Check, Plus } from "lucide-react";
import InitialsChip from "../common/InitialsChip";
import { TextInput } from "../common/FormField";
import { createArticle, setArticleAssignee, setArticleStatus, useArticles } from "../../hooks/useArticles";
import { useUsers } from "../../hooks/useUsers";
import { useAuthStore } from "../../store/useAuthStore";
import type { Idea } from "../../types";

export default function MailerArticles({ idea }: { idea: Idea }) {
  const profile = useAuthStore((s) => s.profile);
  const { data: articles } = useArticles(idea.id);
  const { data: users } = useUsers();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    if (!profile || !newTitle.trim()) return;
    setAdding(true);
    try {
      await createArticle(idea.id, newTitle.trim(), { id: profile.id, initials: profile.initials });
      setNewTitle("");
    } finally {
      setAdding(false);
    }
  }

  const doneCount = articles.filter((a) => a.status === "done").length;

  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="double-rule font-display text-xs uppercase tracking-widest text-ink/60">
          Articles
        </h3>
        {articles.length > 0 && (
          <span className="text-[11px] text-ink/40">
            {doneCount}/{articles.length} done
          </span>
        )}
      </div>

      {articles.length === 0 ? (
        <p className="mb-3 text-sm text-ink/40">No articles added yet.</p>
      ) : (
        <div className="mb-3 space-y-2">
          {articles.map((article) => {
            const assignee = users.find((u) => u.id === article.assigneeId);
            const done = article.status === "done";
            return (
              <div key={article.id} className="flex items-center gap-2 rounded-lg bg-format-article/[0.07] px-3 py-2.5">
                <button
                  onClick={() => setArticleStatus(idea.id, article.id, done ? "open" : "done")}
                  aria-label={done ? "Mark open" : "Mark done"}
                  className={`flex h-5 w-5 flex-none items-center justify-center rounded-full border transition ${
                    done ? "border-fairway bg-fairway text-white" : "border-ink/25 text-transparent"
                  }`}
                >
                  <Check size={12} />
                </button>
                <p className={`min-w-0 flex-1 truncate text-sm ${done ? "text-ink/40 line-through" : "text-ink"}`}>
                  {article.title}
                </p>
                <select
                  value={article.assigneeId ?? ""}
                  onChange={(e) => setArticleAssignee(idea.id, article.id, e.target.value || null)}
                  className="flex-none rounded-full border border-ink/12 bg-white px-2 py-1 text-[11px] text-ink/70"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.initials}
                    </option>
                  ))}
                </select>
                {assignee && <InitialsChip initials={assignee.initials} colour={assignee.colour} size="xs" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <TextInput
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Add an article…"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          className="flex-none rounded-lg bg-format-article px-3 text-dark-green disabled:opacity-50"
          aria-label="Add article"
        >
          <Plus size={18} />
        </button>
      </div>
    </section>
  );
}
