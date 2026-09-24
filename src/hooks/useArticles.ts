import { useMemo } from "react";
import { addDoc, doc, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { articlesCol } from "../firebase/collections";
import type { Article } from "../types";

export function useArticles(ideaId: string | undefined) {
  const q = useMemo(
    () => (ideaId ? query(articlesCol(ideaId), orderBy("createdAt", "asc")) : null),
    [ideaId],
  );
  return useFirestoreCollection(q);
}

export async function createArticle(
  ideaId: string,
  title: string,
  actor: { id: string; initials: string },
) {
  await addDoc(articlesCol(ideaId), {
    title,
    assigneeId: null,
    status: "open",
    authorId: actor.id,
    authorInitials: actor.initials,
    createdAt: serverTimestamp(),
  } as unknown as Article);
}

export async function setArticleAssignee(ideaId: string, articleId: string, assigneeId: string | null) {
  await updateDoc(doc(articlesCol(ideaId), articleId), { assigneeId });
}

export async function setArticleStatus(ideaId: string, articleId: string, status: Article["status"]) {
  await updateDoc(doc(articlesCol(ideaId), articleId), { status });
}
