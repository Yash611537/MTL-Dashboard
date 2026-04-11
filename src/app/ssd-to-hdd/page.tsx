"use client";

import { Header } from "@/components/header";
import { useFirestoreCursorPage } from "@/hooks/use-firestore-cursor-page";
import { FIRESTORE_PAGE_SIZE } from "@/lib/firestore-page-size";
import { formatMaybeDate, formatMaybeTimeHHMM } from "@/lib/format";

const COLLECTION = "HDD-transfer";

type HddTransferRow = {
  id: string;
  ssd_id?: string;
  hdd_id?: string;
  start_time?: string;
  end_time?: string;
  total_duration?: string | number;
  transfer_status?: string;
  date?: string;
  [key: string]: unknown;
};

function cell(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "object" && v !== null && "toDate" in v) {
    return formatMaybeDate(v as Parameters<typeof formatMaybeDate>[0]);
  }
  return String(v);
}

export default function SsdToHddPage() {
  const {
    rows,
    pageIndex,
    setPageIndex,
    loading,
    pageLoading,
    error,
    pageCount,
  } = useFirestoreCursorPage<HddTransferRow>({
    collectionPath: COLLECTION,
    orderByField: "date",
    orderDirection: "desc",
    mapDoc: (id, data) => ({ ...(data as Omit<HddTransferRow, "id">), id }),
  });

  const canGoNext = pageIndex + 1 < pageCount;

  return (
    <>
      <Header
        title="SSD TO HDD"
        subtitle={`Transfers from ${COLLECTION} in Firestore (${FIRESTORE_PAGE_SIZE} per request).`}
      />
      <main className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-sm text-slate-500">
            <span
              className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
              aria-hidden
            />
            Loading transfers…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <p>{error}</p>
            <p className="mt-2 text-xs text-red-800/90">
              If this mentions an index, create a composite index for{" "}
              <code className="rounded bg-red-100 px-1">date</code> on {COLLECTION}.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">Date</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">SSD ID</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">HDD ID</th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      Start time
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      End time
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      Total duration
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-12 text-center text-slate-500">
                        No documents in {COLLECTION}.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r.id} className="bg-white hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">{cell(r.date)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">{cell(r.ssd_id)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">{cell(r.hdd_id)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {formatMaybeTimeHHMM(r.start_time)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {formatMaybeTimeHHMM(r.end_time)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {cell(r.total_duration)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {cell(r.transfer_status)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Page {pageIndex + 1} of {pageCount || 1}
                {pageLoading ? (
                  <span className="ml-2 font-medium text-brand-600">Loading…</span>
                ) : null}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={pageIndex === 0 || pageLoading}
                  onClick={() => setPageIndex(pageIndex - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canGoNext || pageLoading}
                  onClick={() => setPageIndex(pageIndex + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
