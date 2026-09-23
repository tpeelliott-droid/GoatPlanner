import { FORMAT_LABELS, type Format, type Idea } from "../../types";
import { TextArea } from "../common/FormField";
import { updateIdea } from "../../hooks/useIdeas";
import { useAuthStore } from "../../store/useAuthStore";

const FIELD_LABEL: Partial<Record<Format, string>> = {
  podcast: "Podcast agenda",
};

const FIELD_PLACEHOLDER: Partial<Record<Format, string>> = {
  podcast: "Run of show — topics, questions, segments…",
};

function labelFor(format: Format) {
  return FIELD_LABEL[format] ?? `${FORMAT_LABELS[format]} angle`;
}

function placeholderFor(format: Format) {
  return FIELD_PLACEHOLDER[format] ?? `What's the ${FORMAT_LABELS[format].toLowerCase()} take?`;
}

export default function FormatAngles({ idea }: { idea: Idea }) {
  const profile = useAuthStore((s) => s.profile);

  if (idea.formats.length === 0) return null;

  async function save(format: string, value: string) {
    if (!profile) return;
    await updateIdea(
      idea.id,
      { formatAngles: { ...idea.formatAngles, [format]: value } },
      { id: profile.id, initials: profile.initials },
      `updated the ${labelFor(format as Format).toLowerCase()}`,
      idea.title,
    );
  }

  return (
    <section className="mb-5">
      <h3 className="double-rule mb-2 font-display text-xs uppercase tracking-widest text-ink/60">
        Format details
      </h3>
      <div className="space-y-2">
        {idea.formats.map((format) => (
          <div key={format}>
            <p className="mb-1 text-xs text-ink/50">{labelFor(format)}</p>
            <TextArea
              rows={2}
              defaultValue={idea.formatAngles?.[format] ?? ""}
              placeholder={placeholderFor(format)}
              onBlur={(e) => save(format, e.target.value)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
