import type { ReactNode } from "react";
import clsx from "clsx";

type Accent = "green" | "blue" | "sage" | "rust" | "gold";

const ACCENT_CLASSES: Record<Accent, string> = {
  green: "border-l-4 border-l-fairway bg-fairway/[0.05]",
  blue: "border-l-4 border-l-format-instagram bg-format-instagram/[0.05]",
  sage: "border-l-4 border-l-format-article bg-format-article/[0.07]",
  rust: "border-l-4 border-l-rust bg-rust/[0.05]",
  gold: "border-l-4 border-l-gold bg-gold/[0.09]",
};

export default function Card({
  children,
  className,
  onClick,
  arched = false,
  accent,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  arched?: boolean;
  accent?: Accent;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={clsx(
        "relative block w-full overflow-hidden rounded-xl border border-black/10 bg-white p-4 text-left",
        onClick && "transition active:scale-[0.99] active:bg-black/[0.02]",
        arched && "arch-top pt-6",
        accent && ACCENT_CLASSES[accent],
        className,
      )}
    >
      {children}
    </Comp>
  );
}
