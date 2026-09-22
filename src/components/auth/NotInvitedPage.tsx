import { signOut } from "../../firebase/auth";

export default function NotInvitedPage({ email }: { email: string | null }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 bg-dark-green px-6 text-center safe-top safe-bottom">
      <img src="/icons/goat-mark.svg" alt="" className="h-16 w-16 rounded-2xl opacity-70" />
      <div className="space-y-2">
        <h1 className="font-display text-lg uppercase tracking-widest text-parchment">
          No invite found
        </h1>
        <p className="max-w-xs text-sm text-parchment/70">
          {email ? <>{email} hasn't</> : "This account hasn't"} been invited to the Goat Track
          Planner yet. Ask an Admin to send you an invite, then try again.
        </p>
      </div>
      <button
        onClick={() => signOut()}
        className="rounded-full border border-parchment/30 px-6 py-2 text-sm text-parchment"
      >
        Try a different account
      </button>
    </div>
  );
}
