import { useState } from "react";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field, TextArea, TextInput } from "../common/FormField";
import FormatTicks from "../common/FormatTicks";
import { createIdea } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";
import type { Format } from "../../types";

export default function NewIdeaSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const profile = useAuthStore((s) => s.profile);
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [formats, setFormats] = useState<Format[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!profile) return;
    if (!title.trim()) {
      setError("Give it a title.");
      return;
    }
    if (formats.length === 0) {
      setError("Tick at least one format.");
      return;
    }
    setSaving(true);
    try {
      const id = await createIdea(
        { title: title.trim(), pitch: pitch.trim(), formats, ownerId: profile.id },
        { id: profile.id, initials: profile.initials },
      );
      onCreated(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the idea");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="New idea" onClose={onClose}>
      <Field label="Title">
        <TextInput
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Fancourt links course review"
        />
      </Field>
      <Field label="Formats">
        <FormatTicks value={formats} onChange={setFormats} />
      </Field>
      <Field label="One-line pitch (optional)">
        <TextArea
          rows={2}
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          placeholder="What's the hook?"
        />
      </Field>
      {error && <p className="mb-3 text-sm text-rust">{error}</p>}
      <Button variant="accent" full onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save idea"}
      </Button>
    </Sheet>
  );
}
