export default function InitialsChip({
  initials,
  colour = "#285E53",
  size = "sm",
  title,
}: {
  initials: string;
  colour?: string;
  size?: "xs" | "sm" | "md";
  title?: string;
}) {
  const sizeClasses = {
    xs: "h-5 w-5 text-[9px]",
    sm: "h-7 w-7 text-[11px]",
    md: "h-9 w-9 text-sm",
  }[size];

  return (
    <span
      title={title ?? initials}
      className={`inline-flex flex-none items-center justify-center rounded-full font-display font-semibold text-dark-green ${sizeClasses}`}
      style={{ backgroundColor: colour }}
    >
      {initials}
    </span>
  );
}
