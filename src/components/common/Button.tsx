import type { ButtonHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

type Variant = "primary" | "accent" | "destructive" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
  full?: boolean;
}

export default function Button({
  variant = "primary",
  full = false,
  className,
  children,
  ...rest
}: Props) {
  const variantClasses: Record<Variant, string> = {
    primary: "bg-fairway text-white",
    accent: "bg-gold text-dark-green",
    destructive: "border border-rust text-rust bg-transparent",
    ghost: "border border-ink/20 text-ink bg-transparent",
  };

  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-display text-sm uppercase tracking-wide transition active:scale-[0.98] disabled:opacity-50",
        variantClasses[variant],
        full && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
