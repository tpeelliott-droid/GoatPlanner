import { useMemo } from "react";
import { addDoc, doc, orderBy, query, serverTimestamp, Timestamp, updateDoc, where } from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { interactionsCol, orgsCol, peopleCol } from "../firebase/collections";
import { logActivity } from "../firebase/activity";
import { createTask } from "./useTasks";
import type { Interaction, Org, OrgCategory, Person } from "../types";

export function useOrgs() {
  const q = useMemo(
    () => query(orgsCol(), where("deletedAt", "==", null), orderBy("name", "asc")),
    [],
  );
  return useFirestoreCollection(q);
}

export function usePeople() {
  const q = useMemo(
    () => query(peopleCol(), where("deletedAt", "==", null), orderBy("name", "asc")),
    [],
  );
  return useFirestoreCollection(q);
}

export function useInteractions() {
  const q = useMemo(() => query(interactionsCol(), orderBy("date", "desc")), []);
  return useFirestoreCollection(q);
}

export interface NewOrgInput {
  name: string;
  category: OrgCategory;
  website?: string;
  location?: string;
  ownerId: string;
  tags?: string[];
}

export async function createOrg(input: NewOrgInput, actor: { id: string; initials: string }) {
  const ref = await addDoc(orgsCol(), {
    name: input.name,
    category: input.category,
    website: input.website ?? "",
    location: input.location ?? "",
    ownerId: input.ownerId,
    stage: "target",
    tags: input.tags ?? [],
    notes: "",
    wantToTalkTo: false,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as Org);
  await logActivity({
    entityType: "org",
    entityId: ref.id,
    entityLabel: input.name,
    action: "added to Network",
    authorId: actor.id,
    authorInitials: actor.initials,
  });
  return ref.id;
}

export async function updateOrg(
  id: string,
  data: Partial<Org>,
  actor: { id: string; initials: string },
  actionLabel: string,
  entityLabel: string,
) {
  await updateDoc(doc(orgsCol(), id), { ...data, updatedAt: serverTimestamp() });
  await logActivity({
    entityType: "org",
    entityId: id,
    entityLabel,
    action: actionLabel,
    authorId: actor.id,
    authorInitials: actor.initials,
  });
}

export interface NewPersonInput {
  name: string;
  role?: string;
  orgId?: string;
  phone?: string;
  email?: string;
  instagram?: string;
  ownerId: string;
  howWeKnowThem?: string;
}

export async function createPerson(input: NewPersonInput, actor: { id: string; initials: string }) {
  const ref = await addDoc(peopleCol(), {
    name: input.name,
    role: input.role ?? "",
    orgId: input.orgId ?? null,
    phone: input.phone ?? "",
    email: input.email ?? "",
    instagram: input.instagram ?? "",
    howWeKnowThem: input.howWeKnowThem ?? "",
    ownerId: input.ownerId,
    tags: [],
    starred: false,
    notes: "",
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as Person);
  await logActivity({
    entityType: "person",
    entityId: ref.id,
    entityLabel: input.name,
    action: "added to Network",
    authorId: actor.id,
    authorInitials: actor.initials,
  });
  return ref.id;
}

export async function updatePerson(id: string, data: Partial<Person>) {
  await updateDoc(doc(peopleCol(), id), { ...data, updatedAt: serverTimestamp() });
}

export interface NewInteractionInput {
  parentType: "org" | "person";
  parentId: string;
  type: Interaction["type"];
  date: Date;
  summary: string;
  nextStep?: string;
  nextStepDate?: Date;
  authorId: string;
  authorInitials: string;
}

export async function createInteraction(
  input: NewInteractionInput,
  ownerId: string,
  parentLabel: string,
) {
  await addDoc(interactionsCol(), {
    parentType: input.parentType,
    parentId: input.parentId,
    type: input.type,
    date: Timestamp.fromDate(input.date),
    summary: input.summary,
    nextStep: input.nextStep ?? "",
    nextStepDate: input.nextStepDate ? Timestamp.fromDate(input.nextStepDate) : null,
    authorId: input.authorId,
    authorInitials: input.authorInitials,
    createdAt: serverTimestamp(),
  } as unknown as Interaction);

  if (input.nextStep && input.nextStepDate) {
    await createTask({
      title: input.nextStep,
      assigneeId: ownerId,
      dueDate: input.nextStepDate,
      linkedType: input.parentType,
      linkedId: input.parentId,
      linkedLabel: parentLabel,
      creatorId: input.authorId,
    });
  }
}
