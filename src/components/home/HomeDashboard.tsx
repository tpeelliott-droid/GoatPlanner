import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Check } from "lucide-react";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import FormatChip from "../common/FormatChip";
import InitialsChip from "../common/InitialsChip";
import StatusPill from "../common/StatusPill";
import WelcomeQuoteCard from "../welcome/WelcomeQuoteCard";
import { useAuthStore } from "../../store/useAuthStore";
import { useTasks, claimTask, completeTask } from "../../hooks/useTasks";
import { useEvents } from "../../hooks/useEvents";
import { useIdeas } from "../../hooks/useIdeas";
import { useInteractions, useOrgs, usePeople } from "../../hooks/useNetwork";
import { useUsers, useUserMap } from "../../hooks/useUsers";
import { useRecentActivity } from "../../hooks/useActivity";
import { friendlyDate, isOverdue, relativeTime } from "../../utils/dates";
import { shouldShowWelcome, markWelcomeShown } from "../../utils/welcome";
import type { CalendarEvent, Task } from "../../types";
import { EVENT_TYPE_LABELS } from "../../types";

const MAX_CALENDAR_ITEMS = 20;

export default function HomeDashboard() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome());

  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: ideas } = useIdeas();
  const { data: orgs } = useOrgs();
  const { data: people } = usePeople();
  const { data: interactions } = useInteractions();
  const { data: users } = useUsers();
  const { data: activity } = useRecentActivity(10);
  const userMap = useUserMap(users);

  const myOpenTasks = useMemo(() => {
    const mine = tasks.filter((t) => t.assigneeId === profile?.id && t.status === "open");
    return [...mine].sort((a, b) => {
      const aTime = a.dueDate?.toMillis() ?? Infinity;
      const bTime = b.dueDate?.toMillis() ?? Infinity;
      return aTime - bTime;
    });
  }, [tasks, profile]);

  const upForGrabs = useMemo(() => tasks.filter((t) => !t.assigneeId && t.status === "open"), [tasks]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((e) => e.status !== "cancelled" && e.start.toDate() >= now)
      .sort((a, b) => a.start.toMillis() - b.start.toMillis())
      .slice(0, MAX_CALENDAR_ITEMS);
  }, [events]);

  const calendarGroups = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of upcomingEvents) {
      const key = format(event.start.toDate(), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return Array.from(map.entries());
  }, [upcomingEvents]);

  const needsAttention = useMemo(() => {
    const approvedNoDate = ideas.filter((i) => i.status === "approved");
    const overduePartnerSteps = interactions
      .filter((i) => i.nextStepDate && isOverdue(i.nextStepDate))
      .map((i) => {
        const parent =
          i.parentType === "org" ? orgs.find((o) => o.id === i.parentId) : people.find((p) => p.id === i.parentId);
        return { interaction: i, label: parent?.name ?? "Unknown", href: `/network/${i.parentType}s/${i.parentId}` };
      });
    return { approvedNoDate, overduePartnerSteps };
  }, [ideas, orgs, people, interactions]);

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
    <div className="space-y-6 px-4 py-4">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-ink/50">
          {format(new Date(), "EEEE d MMMM")}
        </p>
        <h2 className="font-display text-xl text-dark-green">
          Hey {profile?.name.split(" ")[0]} 👋
        </h2>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>To do</SectionTitle>
          <button onClick={() => navigate("/my-list")} className="text-xs font-display uppercase text-fairway">
            Full list
          </button>
        </div>
        {myOpenTasks.length === 0 ? (
          <EmptyState title="Nothing on your list" hint="Claim work below, or add your own from My List." />
        ) : (
          <div className="space-y-2">
            {myOpenTasks.map((task) => (
              <Card key={task.id} accent="green">
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => profile && completeTask(task.id, profile.id)}
                    className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-ink/25 text-transparent transition active:border-fairway active:text-fairway"
                    aria-label="Complete task"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      const href = linkedHref(task);
                      if (href) navigate(href);
                    }}
                  >
                    <p className="truncate text-sm text-ink">{task.title}</p>
                    {task.linkedLabel && <p className="truncate text-xs text-ink/50">{task.linkedLabel}</p>}
                  </button>
                  {task.dueDate && (
                    <StatusPill label={friendlyDate(task.dueDate)} tone={isOverdue(task.dueDate) ? "overdue" : "neutral"} />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <SectionTitle>Content calendar</SectionTitle>
          <button onClick={() => navigate("/calendar")} className="text-xs font-display uppercase text-fairway">
            Full calendar
          </button>
        </div>
        {calendarGroups.length === 0 ? (
          <EmptyState title="Nothing scheduled yet" hint="Add a recording or event from the Calendar tab." />
        ) : (
          <Card accent="blue" className="!p-0">
            <div className="divide-y divide-black/5">
              {calendarGroups.map(([key, dayEvents]) => (
                <div key={key} className="px-4 py-3">
                  <p className="mb-1.5 font-display text-[11px] uppercase tracking-widest text-ink/40">
                    {format(new Date(key), "EEEE d MMMM")}
                  </p>
                  <div className="space-y-1.5">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => navigate(`/calendar?event=${event.id}`)}
                        className="flex w-full items-start justify-between gap-2 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-ink">{event.title}</p>
                          <p className="text-xs text-ink/45">
                            {event.allDay ? EVENT_TYPE_LABELS[event.type] : format(event.start.toDate(), "HH:mm")}
                            {event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                        <div className="flex flex-none items-center gap-1">
                          {event.formats.slice(0, 2).map((f) => (
                            <FormatChip key={f} format={f} />
                          ))}
                          {event.attendeeIds.slice(0, 3).map((id) => {
                            const u = userMap.get(id);
                            return u ? (
                              <InitialsChip key={id} initials={u.initials} colour={u.colour} size="xs" />
                            ) : null;
                          })}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </section>

      <section>
        <SectionTitle>Up for grabs</SectionTitle>
        {upForGrabs.length === 0 ? (
          <EmptyState title="No unclaimed work right now" />
        ) : (
          <div className="space-y-2">
            {upForGrabs.slice(0, 5).map((task) => (
              <Card key={task.id} accent="sage">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink">{task.title}</p>
                    {task.linkedLabel && <p className="truncate text-xs text-ink/50">{task.linkedLabel}</p>}
                  </div>
                  <button
                    onClick={() => profile && claimTask(task.id, profile.id)}
                    className="flex-none rounded-full bg-gold px-3 py-1.5 text-xs font-display uppercase text-dark-green"
                  >
                    I'll do this
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {(needsAttention.approvedNoDate.length > 0 || needsAttention.overduePartnerSteps.length > 0) && (
        <section>
          <SectionTitle>Needs attention</SectionTitle>
          <div className="space-y-2">
            {needsAttention.approvedNoDate.slice(0, 4).map((idea) => (
              <Card key={idea.id} accent="rust" onClick={() => navigate(`/ideas/${idea.id}`)}>
                <p className="text-sm text-ink">{idea.title}</p>
                <p className="text-xs text-ink/50">Approved, no date yet</p>
              </Card>
            ))}
            {needsAttention.overduePartnerSteps.slice(0, 4).map(({ interaction, label, href }) => (
              <Card key={interaction.id} accent="rust" onClick={() => navigate(href)}>
                <p className="text-sm text-ink">{label}</p>
                <p className="text-xs text-rust">Next step overdue: {interaction.nextStep}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle>Recent activity</SectionTitle>
        {activity.length === 0 ? (
          <EmptyState title="Nothing's happened yet" />
        ) : (
          <Card>
            <ul className="divide-y divide-black/5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-2 py-2">
                  <InitialsChip initials={a.authorInitials} size="xs" />
                  <p className="min-w-0 flex-1 truncate text-xs text-ink/60">
                    <span className="text-ink">{a.entityLabel}</span> — {a.action}
                  </p>
                  <span className="flex-none text-[10px] text-ink/35">{relativeTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <h3 className="double-rule font-display text-xs uppercase tracking-widest text-ink/55">
      {children}
    </h3>
  );
}
