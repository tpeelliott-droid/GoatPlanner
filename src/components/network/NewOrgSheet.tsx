import { useMemo, useState } from "react";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field, TextInput } from "../common/FormField";
import { createOrg, useOrgs } from "../../hooks/useNetwork";
import { useAuthStore } from "../../store/useAuthStore";
import { ORG_CATEGORY_LABELS, type OrgCategory } from "../../types";

export default function NewOrgSheet({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const { data: orgs } = useOrgs();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<OrgCategory>("sponsor");
  const [website, setWebsite] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const duplicate = useMemo(() => {
    const n = name.trim().toLowerCase();
    if (!n) return null;
    return orgs.find((o) => o.name.toLowerCase() === n);
  }, [orgs, name]);

  async function handleSave() {
    if (!profile) return;
    if (!name.trim()) {
      setError("Give it a name.");
      return;
    }
    setSaving(true);
    try {
      await createOrg(
        { name: name.trim(), category, website: website.trim(), ownerId: profile.id },
        { id: profile.id, initials: profile.initials },
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="New organisation" onClose={onClose}>
      <Field label="Name">
        <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Fancourt" />
      </Field>
      <Field label="Category">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as OrgCategory)}
          className="w-full rounded-lg border border-ink/12 bg-black/[0.04] px-3 py-2.5 text-sm text-ink"
        >
          {Object.entries(ORG_CATEGORY_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Website">
        <TextInput value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
      </Field>

      {duplicate && (
        <p className="mb-3 text-xs text-rust">{duplicate.name} is already in Network — this will add a duplicate.</p>
      )}
      {error && <p className="mb-3 text-sm text-rust">{error}</p>}
      <Button variant="accent" full onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save organisation"}
      </Button>
    </Sheet>
  );
}
