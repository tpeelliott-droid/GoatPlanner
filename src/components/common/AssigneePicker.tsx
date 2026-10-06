import InitialsChip from "./InitialsChip";
import type { User } from "../../types";

export default function AssigneePicker({
  users,
  value,
  onChange,
}: {
  users: User[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {users.map((u) => {
        const active = value.includes(u.id);
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => toggle(u.id)}
            className={`flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2.5 text-xs transition ${
              active ? "bg-fairway text-white" : "border border-ink/12 text-ink"
            }`}
          >
            <InitialsChip initials={u.initials} colour={u.colour} size="xs" />
            {u.name.split(" ")[0]}
          </button>
        );
      })}
    </div>
  );
}
