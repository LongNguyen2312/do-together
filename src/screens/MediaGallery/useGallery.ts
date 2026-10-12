import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import {
  fetchGalleryPage,
  onGalleryChange,
  readGalleryAccess,
  requestGalleryReadAccess,
} from '@/services/gallery';
import type {
  GalleryAlbum,
  GalleryAsset,
  GalleryPage,
  GalleryReadAccess,
} from '@/types/story';

/** The newest of the whole library from last time, shown at once. */
let lastRecent: GalleryPage | null = null;

const canRead = (access: GalleryReadAccess | null) =>
  access === 'granted' || access === 'limited';

/**
 * The phone's photos and videos, newest first, a batch at a time: the whole
 * library, or `album`. Asks for access on first use, and checks again on
 * coming back from Settings.
 */
export function useGallery(album: GalleryAlbum | null) {
  /** Null while it's being checked. */
  const [access, setAccess] = useState<GalleryReadAccess | null>(null);
  /** Null until the first batch is in. */
  const [assets, setAssets] = useState<GalleryAsset[] | null>(
    lastRecent?.assets ?? null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const next = useRef(lastRecent?.next);
  const loadingMore = useRef(false);
  const albumRef = useRef(album);
  albumRef.current = album;
  /** Changes with every fresh start, so a late batch for another album is dropped. */
  const run = useRef(0);

  const loadFirst = useCallback(async () => {
    const id = ++run.current;
    const from = albumRef.current;
    try {
      const page = await fetchGalleryPage(undefined, from ?? undefined);
      if (id !== run.current) {
        return;
      }
      if (!from) {
        lastRecent = page;
      }
      next.current = page.next;
      setAssets(page.assets);
    } catch {
      if (id === run.current) {
        setAssets(current => current ?? []);
      }
    }
  }, []);

  useEffect(() => {
    requestGalleryReadAccess().then(setAccess, () => setAccess('blocked'));
    // Access may have been changed in Settings meanwhile.
    const appState = AppState.addEventListener('change', state => {
      if (state === 'active') {
        readGalleryAccess().then(setAccess, () => {});
      }
    });
    return () => appState.remove();
  }, []);

  const readable = canRead(access);
  useEffect(() => {
    if (!readable) {
      lastRecent = null;
      return;
    }
    // Another album starts empty; the whole library from where it was.
    setAssets(album ? null : lastRecent?.assets ?? null);
    next.current = undefined;
    loadFirst();
    return onGalleryChange(loadFirst);
  }, [readable, album, loadFirst]);

  const refresh = async () => {
    setRefreshing(true);
    await loadFirst();
    setRefreshing(false);
  };

  const loadMore = async () => {
    const after = next.current;
    if (!after || loadingMore.current) {
      return;
    }
    loadingMore.current = true;
    const id = run.current;
    try {
      const page = await fetchGalleryPage(after, albumRef.current ?? undefined);
      if (id === run.current) {
        next.current = page.next;
        setAssets(current => [...(current ?? []), ...page.assets]);
      }
    } catch {
      // Scrolling to the end again retries.
    } finally {
      loadingMore.current = false;
    }
  };

  /** Asks again, where the system still allows it. */
  const allow = async () => setAccess(await requestGalleryReadAccess());

  return { access, assets, refreshing, refresh, loadMore, allow };
}
