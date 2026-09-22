import { addDoc, serverTimestamp } from "firebase/firestore";
import { activityCol } from "./collections";
import type { ActivityLogEntry } from "../types";

export async function logActivity(entry: {
  entityType: ActivityLogEntry["entityType"];
  entityId: string;
  entityLabel: string;
  action: string;
  authorId: string;
  authorInitials: string;
}) {
  await addDoc(activityCol(), {
    ...entry,
    createdAt: serverTimestamp(),
  } as unknown as ActivityLogEntry);
}
