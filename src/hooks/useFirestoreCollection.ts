import { useEffect, useState } from "react";
import { onSnapshot, type Query } from "firebase/firestore";

interface CollectionState<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribes to a Firestore query in real time. Offline persistence is
 * configured globally (see firebase/config.ts), so this resolves from cache
 * immediately when there's no connection and reconciles when back online.
 */
export function useFirestoreCollection<T>(query: Query<T> | null): CollectionState<T> {
  const [state, setState] = useState<CollectionState<T>>({
    data: [],
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!query) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    const unsubscribe = onSnapshot(
      query,
      (snapshot) => {
        setState({
          data: snapshot.docs.map((doc) => doc.data()),
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({ data: [], loading: false, error });
      },
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return state;
}
