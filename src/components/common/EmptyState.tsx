export default function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-parchment/15 px-6 py-10 text-center">
      <img src="/icons/goat-mark.svg" alt="" className="h-10 w-10 opacity-30" />
      <p className="text-sm font-medium text-parchment/70">{title}</p>
      {hint && <p className="text-xs text-parchment/40">{hint}</p>}
    </div>
  );
}
