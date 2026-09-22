import { useMemo } from "react";
import { addDoc, deleteDoc, doc, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { invitesCol } from "../firebase/collections";
import type { Invite, Role } from "../types";

export function usePendingInvites() {
  const q = useMemo(
    () => query(invitesCol(), where("acceptedAt", "==", null), orderBy("createdAt", "desc")),
    [],
  );
  return useFirestoreCollection(q);
}

export async function createInvite(email: string, role: Role, invitedBy: string) {
  await addDoc(invitesCol(), {
    email: email.trim().toLowerCase(),
    role,
    invitedBy,
    createdAt: serverTimestamp(),
    acceptedAt: null,
  } as unknown as Invite);
}

export async function revokeInvite(id: string) {
  await deleteDoc(doc(invitesCol(), id));
}
