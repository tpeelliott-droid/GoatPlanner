import type { Format } from "../../types";
import { FORMAT_LABELS } from "../../types";
import { FORMAT_COLOURS, FORMAT_TEXT_ON_CHIP } from "../../utils/format";

export default function FormatChip({
  format,
  size = "sm",
}: {
  format: Format;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full font-display font-medium uppercase tracking-wide " +
        (size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs")
      }
      style={{ backgroundColor: FORMAT_COLOURS[format], color: FORMAT_TEXT_ON_CHIP[format] }}
    >
      {FORMAT_LABELS[format]}
    </span>
  );
}
