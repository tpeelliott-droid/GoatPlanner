import InitialsChip from "./InitialsChip";
import type { User } from "../../types";

/**
 * Shows every team member as a toggle chip (editable), or — in read-only
 * mode — just the currently assigned names as static chips. No separate
 * "edit" affordance: whoever can edit sees the live picker directly.
 */
export default function AssigneePicker({
  users,
  value,
  onChange,
  readOnly = false,
}: {
  users: User[];
  value: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
}) {
  function toggle(id: string) {
    if (!onChange) return;
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  const visibleUsers = readOnly ? users.filter((u) => value.includes(u.id)) : users;

  if (readOnly && visibleUsers.length === 0) {
    return <span className="text-xs text-ink/40">Unassigned</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleUsers.map((u) => {
        const active = value.includes(u.id);
        const className = `flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs transition ${
          active ? "bg-fairway text-white" : "border border-ink/12 text-ink"
        }`;
        const content = (
          <>
            <InitialsChip initials={u.initials} colour={u.colour} size="xs" />
            {u.name.split(" ")[0]}
          </>
        );
        return readOnly ? (
          <span key={u.id} className={className}>
            {content}
          </span>
        ) : (
          <button key={u.id} type="button" onClick={() => toggle(u.id)} className={className}>
            {content}
          </button>
        );
      })}
    </div>
  );
}
