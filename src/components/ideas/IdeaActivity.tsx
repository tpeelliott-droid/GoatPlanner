import { useMemo } from "react";
import { query, where, orderBy } from "firebase/firestore";
import { activityCol } from "../../firebase/collections";
import { useFirestoreCollection } from "../../hooks/useFirestoreCollection";
import InitialsChip from "../common/InitialsChip";
import { relativeTime } from "../../utils/dates";

export default function IdeaActivity({ ideaId }: { ideaId: string }) {
  const q = useMemo(
    () => query(activityCol(), where("entityId", "==", ideaId), orderBy("createdAt", "desc")),
    [ideaId],
  );
  const { data: activity } = useFirestoreCollection(q);

  if (activity.length === 0) return null;

  return (
    <section className="mb-5">
      <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-ink/60">
        Activity
      </h3>
      <ul className="space-y-1.5">
        {activity.slice(0, 15).map((a) => (
          <li key={a.id} className="flex items-center gap-2 text-xs">
            <InitialsChip initials={a.authorInitials} size="xs" />
            <span className="text-ink/60">{a.action}</span>
            <span className="ml-auto flex-none text-ink/30">{relativeTime(a.createdAt)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
