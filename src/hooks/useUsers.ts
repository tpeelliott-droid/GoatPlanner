import { useMemo } from "react";
import { doc, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { usersCol } from "../firebase/collections";
import type { User } from "../types";

export function useUsers() {
  const q = useMemo(() => query(usersCol(), orderBy("name")), []);
  return useFirestoreCollection(q);
}

export function useUserMap(users: User[]) {
  return useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
}

export async function updateUser(id: string, data: Partial<User>) {
  await updateDoc(doc(usersCol(), id), data);
}

export async function setHiddenHomeCards(id: string, hidden: string[]) {
  await setDoc(doc(usersCol(), id), { hiddenHomeCards: hidden }, { merge: true });
}

export async function regenerateIcalToken(id: string) {
  const token = crypto.randomUUID();
  await updateDoc(doc(usersCol(), id), { icalToken: token });
  return token;
}
