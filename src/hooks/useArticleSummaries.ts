import { useEffect, useMemo, useState } from "react";
import { onSnapshot } from "firebase/firestore";
import { articlesCol } from "../firebase/collections";
import { useUsers } from "./useUsers";
import type { Article } from "../types";

export interface ArticleSummary {
  total: number;
  done: number;
  assignees: { id: string; initials: string; colour: string }[];
}

/** Subscribes to the articles subcollection of several Mailer ideas at once. */
export function useArticleSummaries(ideaIds: string[]): Map<string, ArticleSummary> {
  const { data: users } = useUsers();
  const [byIdea, setByIdea] = useState<Map<string, Article[]>>(new Map());
  const key = [...ideaIds].sort().join(",");

  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (ids.length === 0) {
      setByIdea(new Map());
      return;
    }
    const unsubscribers = ids.map((ideaId) =>
      onSnapshot(articlesCol(ideaId), (snap) => {
        setByIdea((prev) => {
          const next = new Map(prev);
          next.set(
            ideaId,
            snap.docs.map((d) => d.data()),
          );
          return next;
        });
      }),
    );
    return () => unsubscribers.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useMemo(() => {
    const result = new Map<string, ArticleSummary>();
    for (const [ideaId, articles] of byIdea) {
      const assigneeIds = [...new Set(articles.map((a) => a.assigneeId).filter(Boolean))] as string[];
      const assignees = assigneeIds
        .map((id) => users.find((u) => u.id === id))
        .filter((u): u is NonNullable<typeof u> => Boolean(u))
        .map((u) => ({ id: u.id, initials: u.initials, colour: u.colour }));
      result.set(ideaId, {
        total: articles.length,
        done: articles.filter((a) => a.status === "done").length,
        assignees,
      });
    }
    return result;
  }, [byIdea, users]);
}
