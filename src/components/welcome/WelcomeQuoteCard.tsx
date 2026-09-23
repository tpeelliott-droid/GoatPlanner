import { useState } from "react";
import { nextQuote } from "../../utils/quotes";
import Button from "../common/Button";

export default function WelcomeQuoteCard({ onDismiss }: { onDismiss: () => void }) {
  const [quote] = useState(() => nextQuote());
  const [visible, setVisible] = useState(true);

  function dismiss() {
    setVisible(false);
    setTimeout(onDismiss, 150);
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center gap-8 bg-dark-green px-8 text-center transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <img src="/icons/goat-mark.svg" alt="" className="h-16 w-16 rounded-2xl" />
      <blockquote className="font-display text-2xl leading-snug text-gold">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <cite className="font-display text-xs uppercase tracking-[0.2em] text-parchment/60 not-italic">
        — Gary Player
      </cite>
      <Button variant="accent" onClick={dismiss}>
        Thanks Gary
      </Button>
    </div>
  );
}
