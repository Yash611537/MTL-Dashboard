"use client";

import { useMemo, useState } from "react";
import { aggregateCompanyHoursByDay } from "@/lib/aggregate-company-hours";
import { FIRESTORE_PAGE_SIZE } from "@/lib/firestore-page-size";
import { useSdCardsAccumulatedBatches } from "@/hooks/use-sd-cards-accumulated-batches";
import { CompanyHoursAddDialog } from "./company-hours-add-dialog";
import { CompanyHoursTable } from "./company-hours-table";

export function CompanyHoursPanel() {
  const {
    rowsForAggregate,
    loading,
    fetchingMore,
    error,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
    refresh,
    recordCount,
  } = useSdCardsAccumulatedBatches();
  const [addOpen, setAddOpen] = useState(false);

  const aggregated = useMemo(
    () => aggregateCompanyHoursByDay(rowsForAggregate),
    [rowsForAggregate]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20 sm:text-base">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          Loading company hours from Firestore…
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
    <>
      <div className="mb-3 flex justify-end sm:mb-4">
        <button
          type="button"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          onClick={() => setAddOpen(true)}
        >
          Add entry
        </button>
      </div>
      <CompanyHoursTable
        data={aggregated}
        firestoreBatchPagination={{
          recordCount,
          firestorePageSize: FIRESTORE_PAGE_SIZE,
          canGoPrev,
          canGoNext,
          fetchingMore,
          onPrev: goPrev,
          onNext: goNext,
        }}
      />
      <CompanyHoursAddDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refresh}
      />
    </>
  );
}
