import { useEffect, useState, type ReactNode } from "react";
import { getDocs, limit, query } from "firebase/firestore";
import { onAuthChange, ensureProfile, findInviteForEmail, fetchProfile, acceptInvite } from "../../firebase/auth";
import { usersCol } from "../../firebase/collections";
import { useAuthStore } from "../../store/useAuthStore";
import SignInPage from "./SignInPage";
import NotInvitedPage from "./NotInvitedPage";

export default function AuthProvider({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, loading, setFirebaseUser, setProfile, setLoading } = useAuthStore();
  const [gate, setGate] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      if (!user) {
        setProfile(null);
        setGate("checking");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const existing = await fetchProfile(user.uid);
        if (existing) {
          setProfile(existing);
          setGate("allowed");
          setLoading(false);
          return;
        }

        // No profile yet: either this is the very first user (bootstraps as
        // Admin) or they need a pending invite to proceed.
        const firstRunSnap = await getDocs(query(usersCol(), limit(1)));
        if (firstRunSnap.empty) {
          const created = await ensureProfile(user, "admin");
          setProfile(created);
          setGate("allowed");
          setLoading(false);
          return;
        }

        const invite = user.email ? await findInviteForEmail(user.email) : null;
        if (invite) {
          const created = await ensureProfile(user, invite.role);
          await acceptInvite(invite.id);
          setProfile(created);
          setGate("allowed");
        } else {
          setGate("denied");
        }
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-dark-green">
        <img src="/icons/goat-mark.svg" alt="" className="h-16 w-16 animate-pulse" />
      </div>
    );
  }

  if (!firebaseUser) {
    return <SignInPage />;
  }

  if (gate === "checking") {
    return (
      <div className="flex h-dvh items-center justify-center bg-dark-green">
        <img src="/icons/goat-mark.svg" alt="" className="h-16 w-16 animate-pulse" />
      </div>
    );
  }

  if (gate === "denied") {
    return <NotInvitedPage email={firebaseUser.email} />;
  }

  if (!profile) return null;

  return <>{children}</>;
}
