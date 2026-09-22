import { useMemo } from "react";
import {
  addDoc,
  doc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { tasksCol } from "../firebase/collections";
import { logActivity } from "../firebase/activity";
import type { LinkedItemType, Task } from "../types";

export function useTasks() {
  const q = useMemo(
    () => query(tasksCol(), where("deletedAt", "==", null), orderBy("createdAt", "desc")),
    [],
  );
  return useFirestoreCollection(q);
}

export interface NewTaskInput {
  title: string;
  assigneeId?: string;
  dueDate?: Date;
  priority?: "normal" | "high";
  linkedType?: LinkedItemType;
  linkedId?: string;
  linkedLabel?: string;
  notes?: string;
  creatorId: string;
}

export async function createTask(input: NewTaskInput) {
  await addDoc(tasksCol(), {
    title: input.title,
    assigneeId: input.assigneeId ?? null,
    creatorId: input.creatorId,
    dueDate: input.dueDate ? Timestamp.fromDate(input.dueDate) : null,
    priority: input.priority ?? "normal",
    status: "open",
    linkedType: input.linkedType ?? "none",
    linkedId: input.linkedId ?? null,
    linkedLabel: input.linkedLabel ?? null,
    notes: input.notes ?? "",
    completedAt: null,
    completedBy: null,
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as Task);
}

export async function claimTask(taskId: string, userId: string) {
  await updateDoc(doc(tasksCol(), taskId), { assigneeId: userId, updatedAt: serverTimestamp() });
}

export async function reassignTask(taskId: string, userId: string | null) {
  await updateDoc(doc(tasksCol(), taskId), { assigneeId: userId, updatedAt: serverTimestamp() });
}

export async function completeTask(taskId: string, userId: string) {
  await updateDoc(doc(tasksCol(), taskId), {
    status: "done",
    completedAt: serverTimestamp(),
    completedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function reopenTask(taskId: string) {
  await updateDoc(doc(tasksCol(), taskId), {
    status: "open",
    completedAt: null,
    completedBy: null,
    updatedAt: serverTimestamp(),
  });
}

export async function snoozeTask(taskId: string, newDueDate: Date) {
  await updateDoc(doc(tasksCol(), taskId), {
    dueDate: Timestamp.fromDate(newDueDate),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteTask(taskId: string, actor: { id: string; initials: string }, title: string) {
  await updateDoc(doc(tasksCol(), taskId), { deletedAt: serverTimestamp() });
  await logActivity({
    entityType: "task",
    entityId: taskId,
    entityLabel: title,
    action: "removed the task",
    authorId: actor.id,
    authorInitials: actor.initials,
  });
}
