import {
  collection,
  type CollectionReference,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import type {
  ActivityLogEntry,
  Article,
  CalendarEvent,
  ContentItem,
  Idea,
  IdeaEntry,
  Interaction,
  Invite,
  Org,
  Person,
  Task,
  User,
} from "../types";

function makeConverter<T extends { id: string }>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T): DocumentData {
      const { id: _id, ...rest } = model;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      return { id: snapshot.id, ...snapshot.data() } as T;
    },
  };
}

function typedCollection<T extends { id: string }>(path: string): CollectionReference<T> {
  return collection(db, path).withConverter(makeConverter<T>());
}

// Tasks and Ideas used to store a single `assigneeId` (or none, for ideas).
// Existing documents written before multi-assignee support may still only
// have that old field — normalise them into `assigneeIds` on read so the
// rest of the app can treat it as always-present.
function makeAssigneeMigratingConverter<
  T extends { id: string; assigneeIds: string[] },
>(): FirestoreDataConverter<T> {
  return {
    toFirestore(model: T): DocumentData {
      const { id: _id, ...rest } = model;
      return rest;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot): T {
      const data = snapshot.data() as DocumentData & { assigneeId?: string };
      const assigneeIds = Array.isArray(data.assigneeIds)
        ? data.assigneeIds
        : data.assigneeId
          ? [data.assigneeId]
          : [];
      return { id: snapshot.id, ...data, assigneeIds } as T;
    },
  };
}

function typedCollectionWithAssigneeMigration<
  T extends { id: string; assigneeIds: string[] },
>(path: string): CollectionReference<T> {
  return collection(db, path).withConverter(makeAssigneeMigratingConverter<T>());
}

export const usersCol = () => typedCollection<User>("users");
export const invitesCol = () => typedCollection<Invite>("invites");
export const ideasCol = () => typedCollectionWithAssigneeMigration<Idea>("ideas");
export const ideaEntriesCol = (ideaId: string) =>
  typedCollection<IdeaEntry>(`ideas/${ideaId}/entries`);
export const articlesCol = (ideaId: string) =>
  typedCollection<Article>(`ideas/${ideaId}/articles`);
export const eventsCol = () => typedCollection<CalendarEvent>("events");
export const contentItemsCol = () => typedCollection<ContentItem>("contentItems");
export const orgsCol = () => typedCollection<Org>("orgs");
export const peopleCol = () => typedCollection<Person>("people");
export const interactionsCol = () => typedCollection<Interaction>("interactions");
export const tasksCol = () => typedCollectionWithAssigneeMigration<Task>("tasks");
export const activityCol = () => typedCollection<ActivityLogEntry>("activity");
