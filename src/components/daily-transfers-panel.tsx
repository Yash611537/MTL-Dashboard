"use client";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  type FirestoreError,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { getDb } from "@/lib/firebase";
import type { DailyTransferRow } from "@/types/daily-transfer";
import { DailyTransferDialog } from "./daily-transfer-dialog";
import { DailyTransfersTable } from "./daily-transfers-table";

function collectionName(): string {
  return (
    process.env.NEXT_PUBLIC_FIRESTORE_DAILY_TRANSFERS_COLLECTION ?? "Daily-Transfer-Data"
  );
}

export function DailyTransfersPanel() {
  const [rows, setRows] = useState<DailyTransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DailyTransferRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const coll = collectionName();

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    let unsubscribe: (() => void) | undefined;
    try {
      const db = getDb();
      const ref = collection(db, coll);
      unsubscribe = onSnapshot(
        ref,
        (snap) => {
          if (cancelled) return;
          const next: DailyTransferRow[] = snap.docs.map((docSnap) => {
            const data = docSnap.data() as Omit<DailyTransferRow, "id">;
            return { ...data, id: docSnap.id };
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
  }, [coll]);

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(row: DailyTransferRow) {
    setEditing(row);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditing(null);
  }

  async function handleDelete(row: DailyTransferRow) {
    setDeletingId(row.id);
    try {
      const db = getDb();
      await deleteDoc(doc(db, coll, row.id));
      if (editing?.id === row.id) closeDialog();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      window.alert(msg);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20 sm:text-base">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          Loading daily transfers…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900">
        <p className="font-medium">Could not load data</p>
        <p className="mt-1 text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <>
      <DailyTransfersTable
        data={rows}
        onAdd={openAdd}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
      />
      <DailyTransferDialog
        open={dialogOpen}
        collectionName={coll}
        editing={editing}
        onClose={closeDialog}
      />
    </>
  );
}
