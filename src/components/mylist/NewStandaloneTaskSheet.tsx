import { useState } from "react";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field, TextInput } from "../common/FormField";
import { createTask } from "../../hooks/useTasks";
import { useAuthStore } from "../../store/useAuthStore";

export default function NewStandaloneTaskSheet({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile || !title.trim()) return;
    setSaving(true);
    try {
      await createTask({
        title: title.trim(),
        assigneeId: profile.id,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        creatorId: profile.id,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="New task" onClose={onClose}>
      <Field label="What needs doing?">
        <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Due date (optional)">
        <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </Field>
      <Button variant="accent" full onClick={handleSave} disabled={saving || !title.trim()}>
        {saving ? "Saving…" : "Add to My List"}
      </Button>
    </Sheet>
  );
}
