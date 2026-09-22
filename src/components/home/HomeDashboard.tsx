import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, isWithinInterval, addDays, endOfDay } from "date-fns";
import Card from "../common/Card";
import EmptyState from "../common/EmptyState";
import FormatChip from "../common/FormatChip";
import InitialsChip from "../common/InitialsChip";
import StatusPill from "../common/StatusPill";
import WelcomeQuoteCard from "../welcome/WelcomeQuoteCard";
import { useAuthStore } from "../../store/useAuthStore";
import { useTasks, claimTask } from "../../hooks/useTasks";
import { useEvents } from "../../hooks/useEvents";
import { useIdeas } from "../../hooks/useIdeas";
import { useContentItems } from "../../hooks/useContentItems";
import { useInteractions, useOrgs, usePeople } from "../../hooks/useNetwork";
import { useUsers, useUserMap } from "../../hooks/useUsers";
import { useRecentActivity } from "../../hooks/useActivity";
import { friendlyDate, isDueToday, isOverdue, relativeTime, shortDate } from "../../utils/dates";
import { PIPELINE_STAGE_LABELS } from "../../types";
import { shouldShowWelcome, markWelcomeShown } from "../../utils/welcome";

export default function HomeDashboard() {
  const navigate = useNavigate();
  const profile = useAuthStore((s) => s.profile);
  const [showWelcome, setShowWelcome] = useState(shouldShowWelcome());

  const { data: tasks } = useTasks();
  const { data: events } = useEvents();
  const { data: ideas } = useIdeas();
  const { data: contentItems } = useContentItems();
  const { data: orgs } = useOrgs();
  const { data: people } = usePeople();
  const { data: interactions } = useInteractions();
  const { data: users } = useUsers();
  const { data: activity } = useRecentActivity(10);
  const userMap = useUserMap(users);

  const myTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.assigneeId === profile?.id && t.status === "open" && (isOverdue(t.dueDate) || isDueToday(t.dueDate)),
      ),
    [tasks, profile],
  );

  const upForGrabs = useMemo(() => tasks.filter((t) => !t.assigneeId && t.status === "open"), [tasks]);

  const upcomingRecordings = useMemo(
    () =>
      events
        .filter((e) => e.type === "recording" && e.status !== "cancelled" && e.start.toDate() >= new Date())
        .sort((a, b) => a.start.toMillis() - b.start.toMillis())
        .slice(0, 2),
    [events],
  );

  const restOfWeek = useMemo(() => {
    const now = new Date();
    const weekEnd = endOfDay(addDays(now, 6 - now.getDay()));
    return events
      .filter((e) => e.status !== "cancelled" && isWithinInterval(e.start.toDate(), { start: now, end: weekEnd }))
      .sort((a, b) => a.start.toMillis() - b.start.toMillis())
      .slice(0, 6);
  }, [events]);

  const inProductionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of contentItems) {
      if (item.stage === "published") continue;
      counts[item.stage] = (counts[item.stage] ?? 0) + 1;
    }
    return counts;
  }, [contentItems]);

  const overdueContentItems = useMemo(
    () => contentItems.filter((c) => c.dueDate && isOverdue(c.dueDate) && c.stage !== "published"),
    [contentItems],
  );

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

  return (
    <div className="space-y-4 px-4 py-4">
      <div>
        <p className="font-display text-xs uppercase tracking-widest text-parchment/50">
          {format(new Date(), "EEEE d MMMM")}
        </p>
        <h2 className="font-display text-xl text-parchment">
          Hey {profile?.name.split(" ")[0]} 👋
        </h2>
      </div>

      <Card onClick={() => navigate("/my-list")} arched>
        <div className="flex items-center justify-between">
          <p className="font-display text-sm uppercase tracking-wide text-parchment/70">My List</p>
          {myTasks.length > 0 && <StatusPill label={String(myTasks.length)} tone="overdue" />}
        </div>
        {myTasks.length === 0 ? (
          <p className="mt-2 text-sm text-parchment/50">
            Nothing due today — {ideas.filter((i) => i.status === "approved").length} ideas are ready to schedule.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {myTasks.slice(0, 3).map((t) => (
              <li key={t.id} className="truncate text-sm text-parchment">
                {t.title}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <section>
        <SectionTitle>Next two recordings</SectionTitle>
        {upcomingRecordings.length === 0 ? (
          <EmptyState title="No recordings booked yet" hint="Add one from the Calendar tab." />
        ) : (
          <div className="space-y-2">
            {upcomingRecordings.map((event) => (
              <Card key={event.id} onClick={() => navigate(`/calendar?event=${event.id}`)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-parchment">{event.title}</p>
                    <p className="text-xs text-parchment/50">
                      {friendlyDate(event.start)}
                      {event.location ? ` · ${event.location}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">{event.formats.map((f) => <FormatChip key={f} format={f} />)}</div>
                </div>
                <div className="mt-2 flex gap-1">
                  {event.attendeeIds.map((id) => {
                    const u = userMap.get(id);
                    return u ? <InitialsChip key={id} initials={u.initials} colour={u.colour} size="xs" /> : null;
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Rest of this week</SectionTitle>
        {restOfWeek.length === 0 ? (
          <EmptyState title="Nothing else on the calendar this week" />
        ) : (
          <Card>
            <ul className="divide-y divide-white/5">
              {restOfWeek.map((event) => (
                <li key={event.id}>
                  <button
                    onClick={() => navigate(`/calendar?event=${event.id}`)}
                    className="flex w-full items-center justify-between gap-2 py-2 text-left"
                  >
                    <span className="truncate text-sm text-parchment">{event.title}</span>
                    <span className="flex-none text-xs text-parchment/50">{shortDate(event.start)}</span>
                  </button>
                </li>
              ))}
            </ul>
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
              <Card key={task.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-parchment">{task.title}</p>
                    {task.linkedLabel && <p className="truncate text-xs text-parchment/50">{task.linkedLabel}</p>}
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

      <section>
        <SectionTitle>In production</SectionTitle>
        <Card onClick={() => navigate("/pipeline")}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(inProductionCounts).length === 0 ? (
              <p className="text-sm text-parchment/50">Nothing in the pipeline yet.</p>
            ) : (
              Object.entries(inProductionCounts).map(([stage, count]) => (
                <StatusPill key={stage} label={`${PIPELINE_STAGE_LABELS[stage as keyof typeof PIPELINE_STAGE_LABELS]} · ${count}`} tone="progress" />
              ))
            )}
            {overdueContentItems.length > 0 && (
              <StatusPill label={`${overdueContentItems.length} overdue`} tone="overdue" />
            )}
          </div>
        </Card>
      </section>

      {(needsAttention.approvedNoDate.length > 0 || needsAttention.overduePartnerSteps.length > 0) && (
        <section>
          <SectionTitle>Needs attention</SectionTitle>
          <div className="space-y-2">
            {needsAttention.approvedNoDate.slice(0, 4).map((idea) => (
              <Card key={idea.id} onClick={() => navigate(`/ideas/${idea.id}`)}>
                <p className="text-sm text-parchment">{idea.title}</p>
                <p className="text-xs text-parchment/50">Approved, no date yet</p>
              </Card>
            ))}
            {needsAttention.overduePartnerSteps.slice(0, 4).map(({ interaction, label, href }) => (
              <Card key={interaction.id} onClick={() => navigate(href)}>
                <p className="text-sm text-parchment">{label}</p>
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
            <ul className="divide-y divide-white/5">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center gap-2 py-2">
                  <InitialsChip initials={a.authorInitials} size="xs" />
                  <p className="min-w-0 flex-1 truncate text-xs text-parchment/70">
                    <span className="text-parchment">{a.entityLabel}</span> — {a.action}
                  </p>
                  <span className="flex-none text-[10px] text-parchment/40">{relativeTime(a.createdAt)}</span>
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
    <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-parchment/60">
      {children}
    </h3>
  );
}
