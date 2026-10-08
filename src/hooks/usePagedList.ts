import { useCallback, useEffect, useRef, useState } from 'react';

import type { Page } from '@/services/discover';

export type PagedLoadMode = 'initial' | 'refresh' | 'more';

/**
 * Loads a list page by page, with pull-to-refresh and load-more.
 * Pass a stable `fetchPage` (useCallback); a new one reloads from page 0.
 */
export function usePagedList<T>(fetchPage: (page: number) => Promise<Page<T>>) {
  const [items, setItems] = useState<T[]>([]);
  const [nextPage, setNextPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState<PagedLoadMode | null>('initial');
  const [failed, setFailed] = useState(false);
  // A newer request (e.g. a refresh during load-more) makes older responses stale.
  const requestId = useRef(0);
  // onEndReached can fire again before the loading state re-renders.
  const busy = useRef(false);

  const load = useCallback(
    async (page: number, mode: PagedLoadMode) => {
      const id = ++requestId.current;
      busy.current = true;
      setLoading(mode);
      setFailed(false);
      try {
        const result = await fetchPage(page);
        if (id !== requestId.current) {
          return;
        }
        setItems(prev =>
          page === 0 ? result.items : [...prev, ...result.items],
        );
        setNextPage(page + 1);
        setHasMore(result.hasMore);
      } catch {
        if (id === requestId.current) {
          setFailed(true);
        }
      } finally {
        if (id === requestId.current) {
          busy.current = false;
          setLoading(null);
        }
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    load(0, 'initial');
  }, [load]);

  const refresh = () => load(0, 'refresh');
  const loadMore = () => {
    if (busy.current || !hasMore || failed || !items.length) {
      return;
    }
    load(nextPage, 'more');
  };
  const retryMore = () => load(nextPage, 'more');

  return { items, hasMore, loading, failed, refresh, loadMore, retryMore };
}

export type PagedList<T> = ReturnType<typeof usePagedList<T>>;
