import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useVisualViewportHeight } from "../../hooks/useVisualViewportHeight";

export default function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const viewportHeight = useVisualViewportHeight();

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 flex flex-col justify-end bg-black/50"
      style={{ height: viewportHeight }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="overflow-y-auto rounded-t-2xl border-t border-black/10 bg-white px-5 pb-8 pt-4 safe-bottom"
        style={{ maxHeight: viewportHeight * 0.88 }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-black/15" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-base uppercase tracking-wide text-dark-green">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-ink/50 active:bg-black/5"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
