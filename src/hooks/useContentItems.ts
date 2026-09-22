import { useMemo } from "react";
import { addDoc, doc, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { contentItemsCol } from "../firebase/collections";
import { logActivity } from "../firebase/activity";
import type { ChecklistItem, ContentItem, Format, PipelineStage } from "../types";

export function useContentItems() {
  const q = useMemo(
    () => query(contentItemsCol(), where("deletedAt", "==", null), orderBy("createdAt", "desc")),
    [],
  );
  return useFirestoreCollection(q);
}

const CHECKLIST_TEMPLATES: Record<Format, string[]> = {
  podcast: ["Guest confirmed", "Questions drafted", "Recorded", "Edited", "Show notes", "Artwork", "Scheduled"],
  video: ["Shot list ready", "Recorded", "Edited", "Thumbnail", "Scheduled"],
  article: ["Draft", "Edit", "Images", "Sponsor slot", "Sent"],
  instagram: ["Shot", "Edited", "Caption", "Scheduled"],
};

export function checklistTemplateFor(format: Format): ChecklistItem[] {
  return CHECKLIST_TEMPLATES[format].map((label, i) => ({
    id: `${format}-${i}`,
    label,
    done: false,
  }));
}

export async function createContentItem(
  ideaId: string,
  format: Format,
  actor: { id: string; initials: string },
  ideaTitle: string,
) {
  const ref = await addDoc(contentItemsCol(), {
    ideaId,
    format,
    stage: "approved" satisfies PipelineStage,
    checklist: checklistTemplateFor(format),
    sponsorDeliverables: [],
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as unknown as ContentItem);
  await logActivity({
    entityType: "contentItem",
    entityId: ref.id,
    entityLabel: `${ideaTitle} (${format})`,
    action: "moved to Approved in the pipeline",
    authorId: actor.id,
    authorInitials: actor.initials,
  });
  return ref.id;
}

export async function updateContentItemStage(
  id: string,
  stage: PipelineStage,
  actor: { id: string; initials: string },
  label: string,
) {
  await updateDoc(doc(contentItemsCol(), id), { stage, updatedAt: serverTimestamp() });
  await logActivity({
    entityType: "contentItem",
    entityId: id,
    entityLabel: label,
    action: `moved to ${stage}`,
    authorId: actor.id,
    authorInitials: actor.initials,
  });
}

export async function updateContentItem(id: string, data: Partial<ContentItem>) {
  await updateDoc(doc(contentItemsCol(), id), { ...data, updatedAt: serverTimestamp() });
}
