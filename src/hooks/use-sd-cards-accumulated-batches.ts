"use client";

import {
  collection,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { getDb } from "@/lib/firebase";
import { sdCardsCollectionName } from "@/lib/sd-cards-collection";
import type { SdCardRow } from "@/types/sd-card";
import { FIRESTORE_PAGE_SIZE } from "@/lib/firestore-page-size";

/**
 * Loads SD_CARDS in batches of 25 using **ascending** document ID order so **every** document is
 * included and no custom index is needed. (`documentId` **desc** is not supported the same way
 * in Firestore; `written_at_utc` omits docs without that field.)
 * Each "Next" reveals another batch or fetches the next 25 from Firestore.
 */
export function useSdCardsAccumulatedBatches() {
  const [batches, setBatches] = useState<SdCardRow[][]>([]);
  const [visibleBatchCount, setVisibleBatchCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreOnServer, setHasMoreOnServer] = useState(true);

  const lastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const refreshTokenRef = useRef(0);

  const mapRow = useCallback((id: string, data: Record<string, unknown>): SdCardRow => {
    return { ...(data as Omit<SdCardRow, "id">), id };
  }, []);

  const fetchOneBatch = useCallback(async (token: number): Promise<SdCardRow[] | null> => {
    const db = getDb();
    const ref = collection(db, sdCardsCollectionName());
    let q = query(ref, orderBy(documentId(), "asc"), limit(FIRESTORE_PAGE_SIZE));
    const last = lastDocRef.current;
    if (last) {
      q = query(
        ref,
        orderBy(documentId(), "asc"),
        startAfter(last),
        limit(FIRESTORE_PAGE_SIZE)
      );
    }
    const snap = await getDocs(q);
    if (token !== refreshTokenRef.current) return null;
    const rows = snap.docs.map((d) => mapRow(d.id, d.data() as Record<string, unknown>));
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
    setHasMoreOnServer(snap.docs.length === FIRESTORE_PAGE_SIZE);
    return rows;
  }, [mapRow]);

  useEffect(() => {
    let cancelled = false;
    const token = refreshTokenRef.current;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await fetchOneBatch(token);
        if (cancelled || token !== refreshTokenRef.current) return;
        if (rows && rows.length > 0) {
          setBatches([rows]);
          setVisibleBatchCount(1);
        } else {
          setBatches([]);
          setVisibleBatchCount(1);
          setHasMoreOnServer(false);
        }
      } catch (e) {
        if (!cancelled && token === refreshTokenRef.current) {
          setError(e instanceof Error ? e.message : "Failed to load SD_CARDS");
        }
      } finally {
        if (!cancelled && token === refreshTokenRef.current) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchOneBatch]);

  const refresh = useCallback(() => {
    refreshTokenRef.current += 1;
    lastDocRef.current = null;
    setBatches([]);
    setVisibleBatchCount(1);
    setHasMoreOnServer(true);
    setLoading(true);
    setError(null);
    const token = refreshTokenRef.current;
    void (async () => {
      try {
        const rows = await fetchOneBatch(token);
        if (token !== refreshTokenRef.current) return;
        if (rows && rows.length > 0) {
          setBatches([rows]);
          setVisibleBatchCount(1);
        } else {
          setBatches([]);
          setHasMoreOnServer(false);
        }
      } catch (e) {
        if (token === refreshTokenRef.current) {
          setError(e instanceof Error ? e.message : "Failed to load SD_CARDS");
        }
      } finally {
        if (token === refreshTokenRef.current) setLoading(false);
      }
    })();
  }, [fetchOneBatch]);

  const appendBatchFromServer = useCallback(async () => {
    const token = refreshTokenRef.current;
    setFetchingMore(true);
    setError(null);
    try {
      const rows = await fetchOneBatch(token);
      if (token !== refreshTokenRef.current) return;
      if (rows && rows.length > 0) {
        setBatches((prev) => [...prev, rows]);
        setVisibleBatchCount((v) => v + 1);
      }
    } catch (e) {
      if (token === refreshTokenRef.current) {
        setError(e instanceof Error ? e.message : "Failed to load more");
      }
    } finally {
      if (token === refreshTokenRef.current) setFetchingMore(false);
    }
  }, [fetchOneBatch]);

  const goNext = useCallback(() => {
    if (visibleBatchCount < batches.length) {
      setVisibleBatchCount((v) => v + 1);
      return;
    }
    if (hasMoreOnServer && !fetchingMore) void appendBatchFromServer();
  }, [visibleBatchCount, batches.length, hasMoreOnServer, fetchingMore, appendBatchFromServer]);

  const goPrev = useCallback(() => {
    setVisibleBatchCount((v) => Math.max(1, v - 1));
  }, []);

  const flatRows = batches.slice(0, visibleBatchCount).flat();

  const canGoNext =
    visibleBatchCount < batches.length || (visibleBatchCount === batches.length && hasMoreOnServer);

  return {
    rowsForAggregate: flatRows,
    loading,
    fetchingMore,
    error,
    visibleBatchCount,
    totalBatchesLoaded: batches.length,
    hasMoreOnServer,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev: visibleBatchCount > 1,
    refresh,
    recordCount: flatRows.length,
  };
}
