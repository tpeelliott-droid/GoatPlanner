import { useState } from "react";
import Sheet from "../common/Sheet";
import Button from "../common/Button";
import { Field, TextArea, TextInput } from "../common/FormField";
import { createInteraction } from "../../hooks/useNetwork";
import { useAuthStore } from "../../store/useAuthStore";
import { INTERACTION_TYPE_LABELS, type Interaction } from "../../types";

const TYPES: Interaction["type"][] = ["call", "email", "meeting", "whatsapp", "event"];

export default function InteractionForm({
  parentType,
  parentId,
  parentLabel,
  ownerId,
  onClose,
}: {
  parentType: "org" | "person";
  parentId: string;
  parentLabel: string;
  ownerId: string;
  onClose: () => void;
}) {
  const profile = useAuthStore((s) => s.profile);
  const [type, setType] = useState<Interaction["type"]>("call");
  const [summary, setSummary] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [nextStepDate, setNextStepDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!profile || !summary.trim()) return;
    setSaving(true);
    try {
      await createInteraction(
        {
          parentType,
          parentId,
          type,
          date: new Date(),
          summary: summary.trim(),
          nextStep: nextStep.trim() || undefined,
          nextStepDate: nextStepDate ? new Date(nextStepDate) : undefined,
          authorId: profile.id,
          authorInitials: profile.initials,
        },
        ownerId,
        parentLabel,
      );
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Sheet title="Log interaction" onClose={onClose}>
      <Field label="Type">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-full px-3 py-1.5 text-xs uppercase transition ${
                type === t ? "bg-fairway text-white" : "border border-ink/12 text-ink/60"
              }`}
            >
              {INTERACTION_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Summary">
        <TextArea rows={2} autoFocus value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <Field label="Next step (optional)">
        <TextInput value={nextStep} onChange={(e) => setNextStep(e.target.value)} placeholder="Send the proposal" />
      </Field>
      {nextStep && (
        <Field label="Next step date">
          <TextInput type="date" value={nextStepDate} onChange={(e) => setNextStepDate(e.target.value)} />
        </Field>
      )}
      <Button variant="accent" full onClick={handleSave} disabled={saving || !summary.trim()}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </Sheet>
  );
}
