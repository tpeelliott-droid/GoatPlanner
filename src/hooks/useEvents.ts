import { useMemo } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  doc,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { eventsCol } from "../firebase/collections";
import { logActivity } from "../firebase/activity";
import type { CalendarEvent } from "../types";

export function useEvents() {
  const q = useMemo(
    () => query(eventsCol(), where("deletedAt", "==", null), orderBy("start", "asc")),
    [],
  );
  return useFirestoreCollection(q);
}

export function useEvent(id: string | undefined) {
  const { data, loading } = useEvents();
  const event = id ? data.find((e) => e.id === id) : undefined;
  return { event, loading };
}

export interface NewEventInput {
  title: string;
  type: CalendarEvent["type"];
  formats: CalendarEvent["formats"];
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  mapLink?: string;
  attendeeIds: string[];
  ideaIds: string[];
  notes?: string;
  reminderOffsets?: number[];
  createdBy: string;
}

export async function createEvent(input: NewEventInput, actor: { id: string; initials: string }) {
  const ref = await addDoc(eventsCol(), {
    title: input.title,
    type: input.type,
    formats: input.formats,
    start: Timestamp.fromDate(input.start),
    end: Timestamp.fromDate(input.end),
    allDay: input.allDay,
    location: input.location ?? "",
    mapLink: input.mapLink ?? "",
    attendeeIds: input.attendeeIds,
    externalPersonIds: [],
    ideaIds: input.ideaIds,
    orgIds: [],
    notes: input.notes ?? "",
    checklist: [],
    repeatRule: "none",
    status: "tentative",
    reminderOffsets: input.reminderOffsets ?? (input.type === "recording" ? [1440, 60] : []),
    deletedAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: input.createdBy,
  } as unknown as CalendarEvent);
  await logActivity({
    entityType: "event",
    entityId: ref.id,
    entityLabel: input.title,
    action: "created the event",
    authorId: actor.id,
    authorInitials: actor.initials,
  });
  return ref.id;
}

export async function updateEvent(
  id: string,
  data: Partial<CalendarEvent>,
  actor: { id: string; initials: string },
  actionLabel: string,
  entityLabel: string,
) {
  await updateDoc(doc(eventsCol(), id), { ...data, updatedAt: serverTimestamp() });
  await logActivity({
    entityType: "event",
    entityId: id,
    entityLabel,
    action: actionLabel,
    authorId: actor.id,
    authorInitials: actor.initials,
  });
}

export async function deleteEvent(id: string) {
  await updateDoc(doc(eventsCol(), id), { deletedAt: serverTimestamp() });
}

export async function linkIdeaToEvent(eventId: string, ideaId: string) {
  await updateDoc(doc(eventsCol(), eventId), { ideaIds: arrayUnion(ideaId) });
}

export async function unlinkIdeaFromEvent(eventId: string, ideaId: string) {
  await updateDoc(doc(eventsCol(), eventId), { ideaIds: arrayRemove(ideaId) });
}

/** Recording events that overlap in time and share at least one attendee. */
export function findClashes(
  events: CalendarEvent[],
  candidate: { start: Date; end: Date; attendeeIds: string[]; excludeId?: string },
): CalendarEvent[] {
  return events.filter((e) => {
    if (e.id === candidate.excludeId) return false;
    if (e.allDay) return false;
    const start = e.start.toDate();
    const end = e.end.toDate();
    const overlaps = start < candidate.end && end > candidate.start;
    if (!overlaps) return false;
    const sharesAttendee = e.attendeeIds.some((a) => candidate.attendeeIds.includes(a));
    const sameSlot = e.type === "recording" && candidate.attendeeIds.length === 0;
    return sharesAttendee || sameSlot;
  });
}
