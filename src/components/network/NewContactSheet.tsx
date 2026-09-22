import { useMemo, useState } from "react";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field, TextInput } from "../common/FormField";
import { createPerson, usePeople } from "../../hooks/useNetwork";
import { useAuthStore } from "../../store/useAuthStore";

export default function NewContactSheet({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const { data: people } = usePeople();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = useMemo(() => {
    const n = name.trim().toLowerCase();
    const e = email.trim().toLowerCase();
    if (!n && !e) return null;
    return people.find(
      (p) => (n && p.name.toLowerCase() === n) || (e && p.email?.toLowerCase() === e),
    );
  }, [people, name, email]);

  async function handleSave() {
    if (!profile) return;
    if (!name.trim()) {
      setError("Give them a name.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createPerson(
        { name: name.trim(), role: role.trim(), phone: phone.trim(), email: email.trim(), ownerId: profile.id },
        { id: profile.id, initials: profile.initials },
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the contact");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="New contact" onClose={onClose}>
      <Field label="Name">
        <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
      </Field>
      <Field label="Role / organisation">
        <TextInput value={role} onChange={(e) => setRole(e.target.value)} placeholder="Marketing manager, Fancourt" />
      </Field>
      <Field label="Phone">
        <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+27…" />
      </Field>
      <Field label="Email">
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
      </Field>

      {duplicate && (
        <p className="mb-3 text-xs text-rust">
          Looks like {duplicate.name} is already in Network — saving will add a duplicate.
        </p>
      )}
      {error && <p className="mb-3 text-sm text-rust">{error}</p>}
      <Button variant="accent" full onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save contact"}
      </Button>
    </Sheet>
  );
}
