import { create } from "zustand";
import type { User as FirebaseUser } from "firebase/auth";
import type { User as AppUser } from "../types";

interface AuthState {
  firebaseUser: FirebaseUser | null;
  profile: AppUser | null;
  loading: boolean;
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: AppUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  loading: true,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}));
