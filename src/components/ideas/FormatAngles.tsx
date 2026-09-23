import { FORMAT_LABELS, type Idea } from "../../types";
import { TextArea } from "../common/FormField";
import { updateIdea } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";

export default function FormatAngles({ idea }: { idea: Idea }) {
  const profile = useAuthStore((s) => s.profile);

  if (idea.formats.length === 0) return null;

  async function save(format: string, value: string) {
    if (!profile) return;
    await updateIdea(
      idea.id,
      { formatAngles: { ...idea.formatAngles, [format]: value } },
      { id: profile.id, initials: profile.initials },
      `updated the ${FORMAT_LABELS[format as keyof typeof FORMAT_LABELS]} angle`,
      idea.title,
    );
  }

  return (
    <section className="mb-5">
      <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-ink/60">
        Format angles
      </h3>
      <div className="space-y-2">
        {idea.formats.map((format) => (
          <div key={format}>
            <p className="mb-1 text-xs text-ink/50">{FORMAT_LABELS[format]} angle</p>
            <TextArea
              rows={2}
              defaultValue={idea.formatAngles?.[format] ?? ""}
              placeholder={`What's the ${FORMAT_LABELS[format].toLowerCase()} take?`}
              onBlur={(e) => save(format, e.target.value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
