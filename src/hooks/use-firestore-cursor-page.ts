"use client";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDb } from "@/lib/firebase";
import { FIRESTORE_PAGE_SIZE } from "@/lib/firestore-page-size";

export type FirestoreCursorPageResult<T> = {
  rows: T[];
  pageIndex: number;
  setPageIndex: (n: number) => void;
  loading: boolean;
  pageLoading: boolean;
  error: string | null;
  /** TanStack Table: total page count (minimum known). */
  pageCount: number;
  hasNextPage: boolean;
  /** Clear cache and reload current page (e.g. after delete). */
  refresh: () => void;
};

type PageCacheEntry = {
  rows: unknown[];
  lastDoc: QueryDocumentSnapshot | null;
};

/**
 * Cursor-based pagination: one Firestore read per newly visited page (25 docs).
 * Visited pages are cached so going Back does not re-read.
 */
export function useFirestoreCursorPage<T>(options: {
  collectionPath: string;
  orderByField: string;
  orderDirection?: "desc" | "asc";
  mapDoc: (id: string, data: DocumentData) => T;
  enabled?: boolean;
}): FirestoreCursorPageResult<T> {
  const {
    collectionPath,
    orderByField,
    orderDirection = "desc",
    mapDoc,
    enabled = true,
  } = options;

  const [pageIndex, setPageIndexState] = useState(0);
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);

  const cacheRef = useRef<Map<number, PageCacheEntry>>(new Map());
  const refreshTokenRef = useRef(0);

  const ensurePageCached = useCallback(
    async (targetPage: number, token: number): Promise<PageCacheEntry | null> => {
      if (!enabled) return null;
      const existing = cacheRef.current.get(targetPage);
      if (existing) return existing;

      const db = getDb();
      const ref = collection(db, collectionPath);

      for (let p = 0; p < targetPage; p++) {
        const ok = await ensurePageCached(p, token);
        if (token !== refreshTokenRef.current) return null;
        if (!ok && p === targetPage - 1) break;
      }

      let q = query(ref, orderBy(orderByField, orderDirection), limit(FIRESTORE_PAGE_SIZE));
      if (targetPage > 0) {
        const prev = cacheRef.current.get(targetPage - 1);
        const cursor = prev?.lastDoc;
        if (!cursor) {
          throw new Error("Missing pagination cursor");
        }
        q = query(
          ref,
          orderBy(orderByField, orderDirection),
          startAfter(cursor),
          limit(FIRESTORE_PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);
      if (token !== refreshTokenRef.current) return null;

      if (snap.docs.length === 0 && targetPage > 0) {
        return null;
      }

      const mapped = snap.docs.map((d) => mapDoc(d.id, d.data()));
      const lastDoc = snap.docs[snap.docs.length - 1] ?? null;
      const entry: PageCacheEntry = { rows: mapped, lastDoc };
      cacheRef.current.set(targetPage, entry);
      return entry;
    },
    [collectionPath, orderByField, orderDirection, mapDoc, enabled]
  );

  const loadDisplayPage = useCallback(
    async (targetPage: number, token: number) => {
      if (!enabled) return;

      const cachedHit = cacheRef.current.get(targetPage);
      if (cachedHit) {
        if (token !== refreshTokenRef.current) return;
        setRows(cachedHit.rows as T[]);
        setHasNextPage(cachedHit.rows.length === FIRESTORE_PAGE_SIZE);
        setError(null);
        setLoading(false);
        setPageLoading(false);
        return;
      }

      setPageLoading(true);
      setError(null);
      try {
        const entry = await ensurePageCached(targetPage, token);
        if (token !== refreshTokenRef.current) return;

        if (!entry && targetPage > 0) {
          setPageIndexState(targetPage - 1);
          const prevEntry = cacheRef.current.get(targetPage - 1);
          setRows((prevEntry?.rows as T[]) ?? []);
          setHasNextPage(false);
          return;
        }

        if (!entry) {
          setRows([]);
          setHasNextPage(false);
          return;
        }

        setRows(entry.rows as T[]);
        setHasNextPage(entry.rows.length === FIRESTORE_PAGE_SIZE);
      } catch (e) {
        if (token !== refreshTokenRef.current) return;
        setError(e instanceof Error ? e.message : "Failed to load data");
        setRows([]);
        setHasNextPage(false);
      } finally {
        if (token === refreshTokenRef.current) {
          setLoading(false);
          setPageLoading(false);
        }
      }
    },
    [enabled, ensurePageCached]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    const token = refreshTokenRef.current;
    void loadDisplayPage(pageIndex, token);
  }, [pageIndex, enabled, loadDisplayPage]);

  const setPageIndex = useCallback((n: number) => {
    setPageIndexState(Math.max(0, n));
  }, []);

  const refresh = useCallback(() => {
    refreshTokenRef.current += 1;
    cacheRef.current.clear();
    setLoading(true);
    void loadDisplayPage(pageIndex, refreshTokenRef.current);
  }, [loadDisplayPage, pageIndex]);

  const pageCount = hasNextPage ? pageIndex + 2 : pageIndex + 1;

  return {
    rows,
    pageIndex,
    setPageIndex,
    loading,
    pageLoading,
    error,
    pageCount,
    hasNextPage,
    refresh,
  };
}
