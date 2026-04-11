"use client";

import { deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";
import { useFirestoreCursorPage } from "@/hooks/use-firestore-cursor-page";
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
  const coll = collectionName();
  const {
    rows,
    pageIndex,
    setPageIndex,
    loading,
    pageLoading,
    error,
    pageCount,
    refresh,
  } = useFirestoreCursorPage<DailyTransferRow>({
    collectionPath: coll,
    orderByField: "stored_at_utc",
    orderDirection: "desc",
    mapDoc: (id, data) => ({ ...(data as Omit<DailyTransferRow, "id">), id }),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DailyTransferRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      refresh();
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
        <p className="mt-2 text-xs text-red-800/90">
          Ensure Firestore has an index for <code className="rounded bg-red-100 px-1">stored_at_utc</code>{" "}
          (and that documents include this field).
        </p>
      </div>
    );
  }

  return (
    <>
      <DailyTransfersTable
        data={rows}
        serverPagination={{
          pageIndex,
          pageCount,
          onPageChange: setPageIndex,
          pageLoading,
        }}
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
        onSaved={refresh}
      />
    </>
  );
}
