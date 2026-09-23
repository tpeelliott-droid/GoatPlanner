import { useMemo } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { ideaEntriesCol, ideasCol, tasksCol } from "../firebase/collections";
import { logActivity } from "../firebase/activity";
import { completeTask, createTask, reopenTask } from "./useTasks";
import type { Format, Idea, IdeaEntry, IdeaStatus } from "../types";

const IDEA_DONE_STATUSES: IdeaStatus[] = ["published", "parked"];

/** Closes any open task linked to this idea (idea marked done/cancelled). */
async function closeLinkedTasks(ideaId: string, completedBy: string) {
  const q = query(
    tasksCol(),
    where("linkedType", "==", "idea"),
    where("linkedId", "==", ideaId),
    where("status", "==", "open"),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => completeTask(d.id, completedBy)));
}

/** Reopens any completed task linked to this idea (idea un-cancelled/un-published). */
async function reopenLinkedTasks(ideaId: string) {
  const q = query(
    tasksCol(),
    where("linkedType", "==", "idea"),
    where("linkedId", "==", ideaId),
    where("status", "==", "done"),
  );
  const snap = await getDocs(q);
  await Promise.all(snap.docs.map((d) => reopenTask(d.id)));
}

export function useIdeas() {
  const q = useMemo(
    () => query(ideasCol(), where("deletedAt", "==", null), orderBy("createdAt", "desc")),
    [],
  );
  return useFirestoreCollection(q);
}

export function useIdea(id: string | undefined) {
  const { data, loading } = useIdeas();
  const idea = id ? data.find((i) => i.id === id) : undefined;
  return { idea, loading };
}

export function useIdeaEntries(ideaId: string | undefined) {
  const q = useMemo(
    () => (ideaId ? query(ideaEntriesCol(ideaId), orderBy("createdAt", "asc")) : null),
    [ideaId],
  );
  return useFirestoreCollection(q);
}

export interface NewIdeaInput {
  title: string;
  pitch?: string;
  formats: Format[];
  tags?: string[];
  priority?: "normal" | "high";
  ownerId: string;
}

export async function createIdea(input: NewIdeaInput, actor: { id: string; initials: string }) {
  const ref = await addDoc(ideasCol(), {
    title: input.title,
    pitch: input.pitch ?? "",
    formats: input.formats,
    formatAngles: {},
    status: "new" satisfies IdeaStatus,
    tags: input.tags ?? [],
    priority: input.priority ?? "normal",
    ownerId: input.ownerId,
    upvotes: [],
    entryCount: 0,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as Idea);
  await logActivity({
    entityType: "idea",
    entityId: ref.id,
    entityLabel: input.title,
    action: "created the idea",
    authorId: actor.id,
    authorInitials: actor.initials,
  });
  // Every new idea shows up under Tasks until it's published or parked.
  await createTask({
    title: input.title,
    assigneeId: input.ownerId,
    creatorId: actor.id,
    linkedType: "idea",
    linkedId: ref.id,
  });
  return ref.id;
}

export async function updateIdea(
  id: string,
  data: Partial<Idea>,
  actor: { id: string; initials: string },
  actionLabel: string,
  entityLabel: string,
) {
  await updateDoc(doc(ideasCol(), id), { ...data, updatedAt: serverTimestamp() });
  await logActivity({
    entityType: "idea",
    entityId: id,
    entityLabel,
    action: actionLabel,
    authorId: actor.id,
    authorInitials: actor.initials,
  });
  if (data.status) {
    if (IDEA_DONE_STATUSES.includes(data.status)) {
      await closeLinkedTasks(id, actor.id);
    } else {
      await reopenLinkedTasks(id);
    }
  }
}

export async function toggleUpvote(idea: Idea, userId: string) {
  const has = idea.upvotes.includes(userId);
  await updateDoc(doc(ideasCol(), idea.id), {
    upvotes: has ? arrayRemove(userId) : arrayUnion(userId),
  });
}

export async function archiveIdea(id: string) {
  await updateDoc(doc(ideasCol(), id), { deletedAt: serverTimestamp() });
}

export async function addIdeaEntry(
  ideaId: string,
  entry: Omit<IdeaEntry, "id" | "createdAt">,
) {
  await addDoc(ideaEntriesCol(ideaId), {
    ...entry,
    createdAt: serverTimestamp(),
  } as unknown as IdeaEntry);
  await updateDoc(doc(ideasCol(), ideaId), {
    updatedAt: serverTimestamp(),
    entryCount: increment(1),
  });
}

export async function deleteIdeaEntry(ideaId: string, entryId: string) {
  await deleteDoc(doc(ideaEntriesCol(ideaId), entryId));
  await updateDoc(doc(ideasCol(), ideaId), { entryCount: increment(-1) });
}
