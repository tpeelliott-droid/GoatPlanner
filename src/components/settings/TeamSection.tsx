import { useState } from "react";
import { deleteDoc, doc } from "firebase/firestore";
import { UserMinus, X } from "lucide-react";
import InitialsChip from "../common/InitialsChip";
import { TextInput } from "../common/FormField";
import Button from "../common/Button";
import { usersCol } from "../../firebase/collections";
import { useUsers, updateUser } from "../../hooks/useUsers";
import { createInvite, revokeInvite, usePendingInvites } from "../../hooks/useInvites";
import { useAuthStore } from "../../store/useAuthStore";
import type { Role } from "../../types";

export default function TeamSection() {
  const profile = useAuthStore((s) => s.profile);
  const { data: users } = useUsers();
  const { data: invites } = usePendingInvites();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("contributor");
  const [sending, setSending] = useState(false);

  async function handleInvite() {
    if (!email.trim() || !profile) return;
    setSending(true);
    try {
      await createInvite(email, role, profile.id);
      setEmail("");
    } finally {
      setSending(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    await updateUser(userId, { role: newRole });
  }

  async function handleRemove(userId: string) {
    if (userId === profile?.id) {
      alert("You can't remove yourself.");
      return;
    }
    if (!confirm("Remove this person's access? They'll need a new invite to rejoin.")) return;
    await deleteDoc(doc(usersCol(), userId));
  }

  return (
    <section className="mb-6">
      <h3 className="double-rule mb-3 font-display text-xs uppercase tracking-widest text-parchment/60">Team</h3>

      <div className="mb-4 space-y-2">
        {users.map((u) => (
          <div key={u.id} className="flex items-center justify-between gap-2 rounded-lg bg-fairway/40 px-3 py-2">
            <div className="flex items-center gap-2">
              <InitialsChip initials={u.initials} colour={u.colour} size="sm" />
              <div>
                <p className="text-sm text-parchment">{u.name}</p>
                <p className="text-xs text-parchment/40">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={u.role}
                onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                className="rounded-full border border-parchment/15 bg-transparent px-2 py-1 text-xs text-parchment/70"
              >
                <option value="admin">Admin</option>
                <option value="contributor">Contributor</option>
              </select>
              <button onClick={() => handleRemove(u.id)} aria-label="Remove" className="text-parchment/40">
                <UserMinus size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {invites.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <p className="text-xs text-parchment/40">Pending invites</p>
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-lg border border-dashed border-parchment/15 px-3 py-2">
              <span className="text-sm text-parchment/70">
                {inv.email} <span className="text-parchment/40">· {inv.role}</span>
              </span>
              <button onClick={() => revokeInvite(inv.id)} aria-label="Revoke invite" className="text-parchment/40">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <TextInput
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Role)}
          className="rounded-lg border border-parchment/15 bg-white/5 px-2 text-xs text-parchment"
        >
          <option value="contributor">Contributor</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <Button variant="accent" full className="mt-2" onClick={handleInvite} disabled={sending || !email.trim()}>
        {sending ? "Sending…" : "Send invite"}
      </Button>
    </section>
  );
}
