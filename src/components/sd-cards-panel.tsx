"use client";

import { collection, onSnapshot, type FirestoreError } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import { sdCardsCollectionName } from "@/lib/sd-cards-collection";
import type { SdCardRow } from "@/types/sd-card";
import { SdCardsTable } from "./sd-cards-table";

export function SdCardsPanel() {
  const [rows, setRows] = useState<SdCardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    let unsubscribe: (() => void) | undefined;

    try {
      const db = getDb();
      const ref = collection(db, sdCardsCollectionName());
      unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (cancelled) return;
          const next: SdCardRow[] = snap.docs.map((doc) => {
            const data = doc.data() as Omit<SdCardRow, "id">;
            return { ...data, id: doc.id };
          });
          setRows(next);
          setLoading(false);
        },
        (err: FirestoreError) => {
          if (cancelled) return;
          setError(err.message || "Firestore error");
          setLoading(false);
        }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect to Firebase");
      setLoading(false);
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20 sm:text-base">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          Loading SD-Cards from Firestore…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900">
        <p className="font-medium">Could not load data</p>
        <p className="mt-1 text-red-800">{error}</p>
        <p className="mt-3 text-red-700/90">
          Add a <code className="rounded bg-red-100 px-1 py-0.5">.env.local</code> file
          with your Firebase web app config (see{" "}
          <code className="rounded bg-red-100 px-1 py-0.5">.env.local.example</code>
          ).
        </p>
      </div>
    );
  }

  return <SdCardsTable data={rows} />;
}
