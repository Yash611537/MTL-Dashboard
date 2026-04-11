"use client";

import { useFirestoreCursorPage } from "@/hooks/use-firestore-cursor-page";
import { sdCardsCollectionName } from "@/lib/sd-cards-collection";
import type { SdCardRow } from "@/types/sd-card";
import { SdCardsTable } from "./sd-cards-table";

export function SdCardsPanel() {
  const {
    rows,
    pageIndex,
    setPageIndex,
    loading,
    pageLoading,
    error,
    pageCount,
    refresh,
  } = useFirestoreCursorPage<SdCardRow>({
    collectionPath: sdCardsCollectionName(),
    orderByField: "written_at_utc",
    orderDirection: "desc",
    mapDoc: (id, data) => ({ ...(data as Omit<SdCardRow, "id">), id }),
  });

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

  return (
    <SdCardsTable
      data={rows}
      serverPagination={{
        pageIndex,
        pageCount,
        onPageChange: setPageIndex,
        pageLoading,
      }}
      onDataInvalidate={refresh}
    />
  );
}
