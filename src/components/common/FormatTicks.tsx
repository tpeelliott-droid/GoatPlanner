import { FORMATS, FORMAT_LABELS, type Format } from "../../types";
import { FORMAT_COLOURS, FORMAT_TEXT_ON_CHIP } from "../../utils/format";

export default function FormatTicks({
  value,
  onChange,
}: {
  value: Format[];
  onChange: (formats: Format[]) => void;
}) {
  function toggle(format: Format) {
    onChange(value.includes(format) ? value.filter((f) => f !== format) : [...value, format]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {FORMATS.map((format) => {
        const active = value.includes(format);
        return (
          <button
            key={format}
            type="button"
            onClick={() => toggle(format)}
            className="rounded-full px-3 py-1.5 text-xs font-display uppercase tracking-wide transition"
            style={
              active
                ? { backgroundColor: FORMAT_COLOURS[format], color: FORMAT_TEXT_ON_CHIP[format] }
                : { border: "1px solid rgba(244,239,228,0.25)", color: "rgba(244,239,228,0.7)" }
            }
          >
            {FORMAT_LABELS[format]}
          </button>
        );
      })}
    </div>
  );
}
