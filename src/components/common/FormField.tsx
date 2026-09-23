import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full rounded-lg border border-ink/15 bg-black/[0.02] px-3 py-2.5 text-sm text-ink placeholder:text-ink/35 focus:border-fairway focus:outline-none";

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50">
      {children}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={fieldClass + " " + (props.className ?? "")} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={fieldClass + " " + (props.className ?? "")} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
