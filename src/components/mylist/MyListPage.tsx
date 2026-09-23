import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDays } from "date-fns";
import { Check, Clock, UserPlus } from "lucide-react";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import StatusPill from "../common/StatusPill";
import { useAuthStore } from "../../store/useAuthStore";
import { useUsers } from "../../hooks/useUsers";
import {
  claimTask,
  completeTask,
  reassignTask,
  reopenTask,
  snoozeTask,
  useTasks,
} from "../../hooks/useTasks";
import { friendlyDate, isDueToday, isOverdue } from "../../utils/dates";
import type { Task } from "../../types";
import NewStandaloneTaskSheet from "./NewStandaloneTaskSheet";

const GROUPS = ["Overdue", "Today", "This week", "Later", "No date"] as const;

function groupFor(task: Task): (typeof GROUPS)[number] {
  if (!task.dueDate) return "No date";
  if (isOverdue(task.dueDate)) return "Overdue";
  if (isDueToday(task.dueDate)) return "Today";
  const due = task.dueDate.toDate();
  if (due <= addDays(new Date(), 7)) return "This week";
  return "Later";
}

export default function MyListPage() {
  const profile = useAuthStore((s) => s.profile);
  const navigate = useNavigate();
  const { data: tasks } = useTasks();
  const { data: users } = useUsers();
  const [showDone, setShowDone] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  const myTasks = useMemo(() => tasks.filter((t) => t.assigneeId === profile?.id), [tasks, profile]);
  const open = myTasks.filter((t) => t.status === "open");
  const done = myTasks.filter((t) => t.status === "done");

  const grouped = useMemo(() => {
    const map = new Map<(typeof GROUPS)[number], Task[]>(GROUPS.map((g) => [g, []]));
    for (const task of open) map.get(groupFor(task))!.push(task);
    return map;
  }, [open]);

  function linkedHref(task: Task) {
    if (!task.linkedId) return null;
    switch (task.linkedType) {
      case "idea":
        return `/ideas/${task.linkedId}`;
      case "event":
        return `/calendar?event=${task.linkedId}`;
      case "org":
        return `/network/orgs/${task.linkedId}`;
      case "person":
        return `/network/people/${task.linkedId}`;
      default:
        return null;
    }
  }

  return (
    <div className="space-y-5 px-4 py-4">
      <button
        onClick={() => setNewTaskOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-dashed border-ink/20 py-2.5 text-sm text-ink/60"
      >
        + Add a task
      </button>

      {open.length === 0 && <EmptyState title="Nothing on your list" hint="Claim work from Home, or add your own." />}

      {GROUPS.map((group) => {
        const list = grouped.get(group) ?? [];
        if (list.length === 0) return null;
        return (
          <section key={group}>
            <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-ink/60">
              {group} <span className="text-ink/30">· {list.length}</span>
            </h3>
            <div className="space-y-2">
              {list.map((task) => (
                <Card key={task.id} accent="green">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => profile && completeTask(task.id, profile.id)}
                      className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-ink/25 text-transparent transition active:border-fairway active:text-fairway"
                      aria-label="Complete task"
                    >
                      <Check size={12} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <button
                        className="block w-full text-left"
                        onClick={() => {
                          const href = linkedHref(task);
                          if (href) navigate(href);
                        }}
                      >
                        <p className="truncate text-sm text-ink">{task.title}</p>
                        {task.linkedLabel && (
                          <p className="truncate text-xs text-ink/50">{task.linkedLabel}</p>
                        )}
                      </button>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {task.dueDate && (
                          <StatusPill
                            label={friendlyDate(task.dueDate)}
                            tone={isOverdue(task.dueDate) ? "overdue" : "neutral"}
                          />
                        )}
                        {task.priority === "high" && <StatusPill label="High priority" tone="overdue" />}
                        <button
                          onClick={() => task.dueDate && snoozeTask(task.id, addDays(task.dueDate.toDate(), 1))}
                          className="flex items-center gap-1 text-[11px] text-ink/40"
                        >
                          <Clock size={12} /> +1 day
                        </button>
                        <select
                          value={task.assigneeId ?? ""}
                          onChange={(e) => reassignTask(task.id, e.target.value || null)}
                          className="rounded-full border border-ink/12 bg-transparent px-2 py-0.5 text-[11px] text-ink/60"
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.initials}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        );
      })}

      {done.length > 0 && (
        <section>
          <button
            onClick={() => setShowDone((v) => !v)}
            className="mb-2 font-display text-xs uppercase tracking-widest text-ink/40"
          >
            Done ({done.length}) {showDone ? "▲" : "▼"}
          </button>
          {showDone && (
            <div className="space-y-2">
              {done.map((task) => (
                <Card key={task.id} onClick={() => reopenTask(task.id)}>
                  <p className="truncate text-sm text-ink/50 line-through">{task.title}</p>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {newTaskOpen && <NewStandaloneTaskSheet onClose={() => setNewTaskOpen(false)} />}
    </div>
  );
}

export function ClaimButton({ taskId }: { taskId: string }) {
  const profile = useAuthStore((s) => s.profile);
  return (
    <button
      onClick={() => profile && claimTask(taskId, profile.id)}
      className="flex items-center gap-1 rounded-full bg-gold px-3 py-1.5 text-xs font-display uppercase text-dark-green"
    >
      <UserPlus size={12} /> I'll do this
    </button>
  );
}
