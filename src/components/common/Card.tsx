import type { ReactNode } from "react";
import clsx from "clsx";

export default function Card({
  children,
  className,
  onClick,
  arched = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  arched?: boolean;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={clsx(
        "relative block w-full overflow-hidden rounded-xl border border-white/5 bg-fairway/60 p-4 text-left shadow-none",
        onClick && "transition active:scale-[0.99] active:bg-fairway/80",
        arched && "arch-top pt-6",
        className,
      )}
    >
      {children}
    </Comp>
  );
}
