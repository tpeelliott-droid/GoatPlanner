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

export const usersCol = () => typedCollection<User>("users");
export const invitesCol = () => typedCollection<Invite>("invites");
export const ideasCol = () => typedCollection<Idea>("ideas");
export const ideaEntriesCol = (ideaId: string) =>
  typedCollection<IdeaEntry>(`ideas/${ideaId}/entries`);
export const articlesCol = (ideaId: string) =>
  typedCollection<Article>(`ideas/${ideaId}/articles`);
export const eventsCol = () => typedCollection<CalendarEvent>("events");
export const contentItemsCol = () => typedCollection<ContentItem>("contentItems");
export const orgsCol = () => typedCollection<Org>("orgs");
export const peopleCol = () => typedCollection<Person>("people");
export const interactionsCol = () => typedCollection<Interaction>("interactions");
export const tasksCol = () => typedCollection<Task>("tasks");
export const activityCol = () => typedCollection<ActivityLogEntry>("activity");
