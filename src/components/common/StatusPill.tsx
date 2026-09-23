type Tone = "progress" | "overdue" | "parked" | "neutral";

export default function StatusPill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const toneClasses: Record<Tone, string> = {
    progress: "bg-fairway text-white",
    overdue: "border border-rust text-rust",
    parked: "bg-black/5 text-ink/50",
    neutral: "bg-black/5 text-ink/70",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
