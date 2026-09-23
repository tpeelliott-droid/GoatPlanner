import { useEffect, useState } from "react";
import {
  completeMagicLinkSignIn,
  isMagicLinkUrl,
  sendMagicLink,
  signInWithGoogle,
} from "../../firebase/auth";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [completingLink, setCompletingLink] = useState(false);

  useEffect(() => {
    if (isMagicLinkUrl(window.location.href)) {
      setCompletingLink(true);
      completeMagicLinkSignIn(window.location.href)
        .catch((err) => setError(err.message))
        .finally(() => setCompletingLink(false));
    }
  }, []);

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await sendMagicLink(email);
      setLinkSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send the link");
    } finally {
      setBusy(false);
    }
  }

  if (completingLink) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-dark-green px-6 text-center">
        <img src="/icons/goat-logo.png" alt="" className="h-16 w-16 animate-pulse rounded-2xl" />
        <p className="font-display text-sm uppercase tracking-widest text-parchment/70">
          Signing you in…
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-8 bg-dark-green px-6 text-center safe-top safe-bottom">
      <div className="flex flex-col items-center gap-4">
        <img src="/icons/goat-logo.png" alt="Goat Track Planner" className="h-20 w-20 rounded-2xl" />
        <h1 className="font-display text-2xl uppercase tracking-widest text-parchment">
          Goat Track Planner
        </h1>
        <p className="max-w-xs text-sm text-parchment/70">
          Every recording, idea and partner conversation, in one shared place.
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full rounded-full bg-gold px-6 py-3 font-display text-sm uppercase tracking-wider text-dark-green transition active:scale-[0.98] disabled:opacity-50"
        >
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs text-parchment/40">
          <div className="h-px flex-1 bg-parchment/20" />
          or
          <div className="h-px flex-1 bg-parchment/20" />
        </div>

        {linkSent ? (
          <p className="rounded-xl bg-fairway/60 px-4 py-3 text-sm text-parchment">
            Check {email} for a sign-in link.
          </p>
        ) : (
          <form onSubmit={handleMagicLink} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@thegoattrack.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-full border border-parchment/20 bg-transparent px-4 py-3 text-center text-sm text-parchment placeholder:text-parchment/40 focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy || !email}
              className="w-full rounded-full border border-parchment/30 px-6 py-3 font-display text-sm uppercase tracking-wider text-parchment transition active:scale-[0.98] disabled:opacity-50"
            >
              Email me a sign-in link
            </button>
          </form>
        )}

        {error && <p className="text-sm text-rust">{error}</p>}
      </div>

      <p className="max-w-xs text-xs text-parchment/40">
        Invite-only. Ask an Admin for an invite if you don't have access yet.
      </p>
    </div>
  );
}
