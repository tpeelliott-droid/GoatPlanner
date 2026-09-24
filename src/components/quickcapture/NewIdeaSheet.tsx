import { useMemo, useState } from "react";
import { format } from "date-fns";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field, TextArea, TextInput } from "../common/FormField";
import FormatTicks from "../common/FormatTicks";
import { createIdea, useIdeas } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";
import type { Format } from "../../types";

function currentMonthKey() {
  return format(new Date(), "yyyy-MM");
}

function monthLabel(monthKey: string) {
  return format(new Date(`${monthKey}-01T00:00:00`), "MMMM yyyy");
}

export default function NewIdeaSheet({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const profile = useAuthStore((s) => s.profile);
  const { data: ideas } = useIdeas();
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [formats, setFormats] = useState<Format[]>([]);
  const [monthKey, setMonthKey] = useState(currentMonthKey());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMailer = formats.includes("article");

  const existingMailerForMonth = useMemo(() => {
    if (!isMailer) return undefined;
    return ideas.find(
      (i) => i.formats.includes("article") && i.monthKey === monthKey && i.status !== "parked",
    );
  }, [ideas, isMailer, monthKey]);

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
        {
          title: title.trim(),
          pitch: pitch.trim(),
          formats,
          ownerId: profile.id,
          monthKey: isMailer ? monthKey : undefined,
        },
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
      {isMailer && (
        <Field label="Mailer month">
          <TextInput type="month" value={monthKey} onChange={(e) => setMonthKey(e.target.value)} />
        </Field>
      )}
      {existingMailerForMonth && (
        <p className="mb-3 text-xs text-rust">
          "{existingMailerForMonth.title}" is already the {monthLabel(monthKey)} mailer — saving will
          add a second one.
        </p>
      )}
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
