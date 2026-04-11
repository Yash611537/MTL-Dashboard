"use client";

import { deleteDoc, doc } from "firebase/firestore";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { getDb } from "@/lib/firebase";
import { sdCardsCollectionName } from "@/lib/sd-cards-collection";
import type { SdCardRow } from "@/types/sd-card";
import {
  formatEmptyCard,
  formatIdleDisplay,
  formatMaybeDate,
  idleDurationAsNumber,
  toNumber,
} from "@/lib/format";
import { FIRESTORE_PAGE_SIZE } from "@/lib/firestore-page-size";

type ServerPagination = {
  pageIndex: number;
  pageCount: number;
  onPageChange: (index: number) => void;
  pageLoading?: boolean;
};

function activeHours(row: SdCardRow): number {
  const tv = toNumber(row.total_video_hours) ?? 0;
  const idle = idleDurationAsNumber(row.idle_duration) ?? 0;
  return tv - idle;
}

function globalFilterFn(row: { original: SdCardRow }, _columnId: string, filterValue: string) {
  const q = filterValue.trim().toLowerCase();
  if (!q) return true;
  const r = row.original;
  const parts = [
    r.company_name,
    r.company_type,
    r.operator_name,
    r.device_id,
    formatMaybeDate(r.date_of_cop_paste),
    formatMaybeDate(r.date_of_recording),
    formatEmptyCard(r.empty_card),
    r.files_copied != null ? String(r.files_copied) : "",
    r.total_video_hours != null ? String(r.total_video_hours) : "",
    r.idle_duration != null ? formatIdleDisplay(r.idle_duration) : "",
    activeHours(r).toFixed(3),
  ];
  return parts.some((p) => String(p ?? "").toLowerCase().includes(q));
}

function DeleteSdCardButton({
  id,
  summary,
  onDeleted,
}: {
  id: string;
  summary: string;
  onDeleted?: () => void;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      className="rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => {
        const ok = window.confirm(
          `Delete this SD card entry?\n\n${summary}\n\nThis removes the document from Firestore and cannot be undone.`
        );
        if (!ok) return;
        setBusy(true);
        void (async () => {
          try {
            await deleteDoc(doc(getDb(), sdCardsCollectionName(), id));
            onDeleted?.();
          } catch (e) {
            window.alert(e instanceof Error ? e.message : "Could not delete this entry.");
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}

export function SdCardsTable({
  data,
  serverPagination,
  onDataInvalidate,
}: {
  data: SdCardRow[];
  serverPagination: ServerPagination;
  onDataInvalidate?: () => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date_of_recording", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<SdCardRow>[]>(
    () => [
      {
        accessorKey: "company_name",
        header: "Company",
        cell: (info) => info.getValue<string>() ?? "—",
      },
      {
        accessorKey: "company_type",
        header: "Type",
        cell: (info) => info.getValue<string>() ?? "—",
      },
      {
        accessorKey: "operator_name",
        header: "Operator",
        cell: (info) => info.getValue<string>() ?? "—",
      },
      {
        id: "date_of_cop_paste",
        accessorFn: (row) => row.date_of_cop_paste,
        header: "Copy / paste",
        cell: ({ row }) => formatMaybeDate(row.original.date_of_cop_paste),
        sortingFn: (a, b) => {
          const ta = dateSortKey(a.original.date_of_cop_paste);
          const tb = dateSortKey(b.original.date_of_cop_paste);
          return ta - tb;
        },
      },
      {
        id: "date_of_recording",
        accessorFn: (row) => row.date_of_recording,
        header: "Recording",
        cell: ({ row }) => formatMaybeDate(row.original.date_of_recording),
        sortingFn: (a, b) => {
          const ta = dateSortKey(a.original.date_of_recording);
          const tb = dateSortKey(b.original.date_of_recording);
          return ta - tb;
        },
      },
      {
        id: "empty_card",
        accessorFn: (row) => formatEmptyCard(row.empty_card),
        header: "Empty card",
        cell: ({ row }) => formatEmptyCard(row.original.empty_card),
      },
      {
        accessorKey: "files_copied",
        header: "Files copied",
        cell: (info) => {
          const v = info.getValue<number | undefined>();
          return v != null && !Number.isNaN(Number(v)) ? Number(v) : "—";
        },
      },
      {
        accessorKey: "total_video_hours",
        header: "Video hours",
        cell: (info) => formatNum(info.getValue()),
      },
      {
        accessorKey: "idle_duration",
        header: "Idle",
        cell: (info) => formatIdleDisplay(info.getValue()),
      },
      {
        id: "active_hour",
        accessorFn: (row) => activeHours(row),
        header: "Active hours",
        cell: ({ row }) => formatNum(activeHours(row.original)),
      },
      {
        accessorKey: "device_id",
        header: "Device ID",
        cell: (info) => (
          <span className="font-mono text-xs">{info.getValue<string>() ?? "—"}</span>
        ),
      },
      {
        id: "delete",
        header: "Delete",
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
          const summary = [r.company_name, r.device_id, formatMaybeDate(r.date_of_recording)]
            .filter(Boolean)
            .join(" · ");
          return (
            <DeleteSdCardButton
              id={r.id}
              summary={summary || r.id}
              onDeleted={onDataInvalidate}
            />
          );
        },
      },
    ],
    [onDataInvalidate]
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: serverPagination.pageCount,
    onPaginationChange: (updater) => {
      const prev = {
        pageIndex: serverPagination.pageIndex,
        pageSize: FIRESTORE_PAGE_SIZE,
      };
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next.pageIndex !== serverPagination.pageIndex) {
        serverPagination.onPageChange(next.pageIndex);
      }
    },
    state: {
      sorting,
      globalFilter,
      pagination: {
        pageIndex: serverPagination.pageIndex,
        pageSize: FIRESTORE_PAGE_SIZE,
      },
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md flex-1">
          <label htmlFor="sd-global-filter" className="sr-only">
            Search table
          </label>
          <input
            id="sd-global-filter"
            type="search"
            placeholder="Search all columns…"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm outline-none ring-brand-500/20 transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2"
          />
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p className="text-center text-sm text-slate-500 sm:text-right">
          {table.getFilteredRowModel().rows.length} row
          {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          {serverPagination.pageLoading ? (
            <span className="ml-2 text-brand-600">Loading page…</span>
          ) : null}
        </p>
      </div>

      <p className="text-xs text-slate-500 md:hidden" role="note">
        Scroll sideways to see all columns.
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x">
          <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-200 bg-slate-50/90">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-slate-200/80"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: " ↑",
                            desc: " ↓",
                          }[header.column.getIsSorted() as string] ?? null}
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-1 py-0.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-12 text-center text-slate-500"
                  >
                    No rows match your filters.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white transition-colors hover:bg-slate-50/80"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-3 py-2 text-slate-800">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span>Rows per page: {FIRESTORE_PAGE_SIZE} (Firestore)</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage() || serverPagination.pageLoading}
            >
              Previous
            </button>
            <span className="min-w-[7rem] text-center text-sm text-slate-600">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </span>
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage() || serverPagination.pageLoading}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatNum(v: unknown): string {
  const n = toNumber(v);
  if (n === undefined) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function dateSortKey(v: SdCardRow["date_of_recording"]): number {
  if (v == null) return 0;
  if (typeof v === "string") {
    const t = new Date(v).getTime();
    return Number.isNaN(t) ? 0 : t;
  }
  if (typeof v === "object" && "toDate" in v && typeof v.toDate === "function") {
    return v.toDate().getTime();
  }
  return 0;
}
