import {
  isSignInWithEmailLink,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, googleProvider } from "./config";
import { usersCol, invitesCol } from "./collections";
import { query, where, getDocs, limit } from "firebase/firestore";
import type { User } from "../types";

const EMAIL_LINK_STORAGE_KEY = "goatplanner.emailForSignIn";

export function suggestInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLOURS = ["#FFC531", "#C8622F", "#8FA98E", "#3E6B7D", "#285E53"];

export function colourForString(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLOURS[hash % AVATAR_COLOURS.length];
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

/** Checks whether an email has a pending, unaccepted invite (invite-only gate). */
export async function findInviteForEmail(email: string) {
  const q = query(invitesCol(), where("email", "==", email.toLowerCase()), limit(5));
  const snap = await getDocs(q);
  const pending = snap.docs.map((d) => d.data()).find((i) => !i.acceptedAt);
  return pending ?? null;
}

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function sendMagicLink(email: string) {
  const actionCodeSettings = {
    url: `${window.location.origin}/signin-complete`,
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem(EMAIL_LINK_STORAGE_KEY, email);
}

export function isMagicLinkUrl(url: string) {
  return isSignInWithEmailLink(auth, url);
}

export async function completeMagicLinkSignIn(url: string) {
  let email = window.localStorage.getItem(EMAIL_LINK_STORAGE_KEY);
  if (!email) {
    email = window.prompt("Confirm your email to finish signing in") ?? "";
  }
  const result = await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem(EMAIL_LINK_STORAGE_KEY);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export async function acceptInvite(inviteId: string) {
  await setDoc(doc(invitesCol(), inviteId), { acceptedAt: serverTimestamp() }, { merge: true });
}

/** Fetches the Firestore profile for a signed-in Firebase user, if it exists. */
export async function fetchProfile(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(usersCol(), uid));
  return snap.exists() ? snap.data() : null;
}

/** Creates the Firestore profile the first time an invited user signs in. */
export async function ensureProfile(firebaseUser: FirebaseUser, role: User["role"] = "contributor") {
  const existing = await fetchProfile(firebaseUser.uid);
  if (existing) return existing;

  const name = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "New user";
  const initials = await uniqueInitials(suggestInitials(name));
  const profile: User = {
    id: firebaseUser.uid,
    name,
    email: firebaseUser.email ?? "",
    initials,
    colour: colourForString(firebaseUser.uid),
    role,
    pushTokens: [],
    icalToken: crypto.randomUUID(),
    createdAt: serverTimestamp() as unknown as User["createdAt"],
  };
  await setDoc(doc(usersCol(), firebaseUser.uid), profile);
  return profile;
}

async function uniqueInitials(base: string): Promise<string> {
  if (!base) base = "GP";
  let candidate = base;
  let suffix = 1;
  // Keep initials unique within the team by appending a third character if needed.
  // (Small teams, so a handful of reads here is fine.)
  for (let attempts = 0; attempts < 26; attempts++) {
    const q = query(usersCol(), where("initials", "==", candidate), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return candidate;
    candidate = base.length >= 3 ? base.slice(0, 2) + String.fromCharCode(65 + suffix) : base + String.fromCharCode(65 + suffix);
    suffix++;
  }
  return candidate;
}
