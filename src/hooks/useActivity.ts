import { useMemo } from "react";
import { limit, orderBy, query } from "firebase/firestore";
import { useFirestoreCollection } from "./useFirestoreCollection";
import { activityCol } from "../firebase/collections";

export function useRecentActivity(count = 10) {
  const q = useMemo(() => query(activityCol(), orderBy("createdAt", "desc"), limit(count)), [count]);
  return useFirestoreCollection(q);
}
