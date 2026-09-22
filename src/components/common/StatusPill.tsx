type Tone = "progress" | "overdue" | "parked" | "neutral";

export default function StatusPill({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  const toneClasses: Record<Tone, string> = {
    progress: "bg-fairway text-parchment",
    overdue: "border border-rust text-rust",
    parked: "bg-white/10 text-parchment/60",
    neutral: "bg-white/10 text-parchment/80",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
