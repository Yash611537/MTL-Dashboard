"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { CompanyHoursRow } from "@/types/company-hours";
import {
  companyHoursSegmentSortKey,
  displayTotalWorkers,
  formatCompanyHoursDateCell,
  hourSegmentLabel,
} from "@/lib/aggregate-company-hours";

const PAGE_SIZES = [10, 25, 50, 100] as const;

function formatHours(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function globalFilterFn(
  row: { original: CompanyHoursRow },
  _columnId: string,
  filterValue: string
) {
  const q = filterValue.trim().toLowerCase();
  if (!q) return true;
  const r = row.original;
  const parts = [
    r.companyName,
    r.dateKey,
    formatCompanyHoursDateCell(r.dateKey),
    hourSegmentLabel(r.hourSegment),
    String(displayTotalWorkers(r)),
    formatHours(r.totalVideoHours),
    formatHours(r.totalActiveHours),
    formatHours(r.activeHoursPerWorker),
  ];
  return parts.some((p) => String(p ?? "").toLowerCase().includes(q));
}

export function CompanyHoursTable({ data }: { data: CompanyHoursRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "dateKey", desc: true }]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<CompanyHoursRow>[]>(
    () => [
      {
        accessorKey: "companyName",
        header: "COMPANY NAME",
        cell: (info) => info.getValue<string>() ?? "—",
      },
      {
        id: "dateKey",
        accessorFn: (row) => row.dateKey,
        header: "DATE",
        cell: ({ row }) => formatCompanyHoursDateCell(row.original.dateKey),
        sortingFn: (a, b) => a.original.dateKey.localeCompare(b.original.dateKey),
      },
      {
        id: "hourSegment",
        accessorFn: (row) => row.hourSegment,
        header: "SESSION VIDEO",
        cell: ({ row }) => hourSegmentLabel(row.original.hourSegment),
        sortingFn: (a, b) =>
          companyHoursSegmentSortKey(a.original.hourSegment) -
          companyHoursSegmentSortKey(b.original.hourSegment),
      },
      {
        id: "totalWorkersDisplay",
        accessorFn: (row) => displayTotalWorkers(row),
        header: "TOTAL WORKERS",
        cell: ({ row }) => displayTotalWorkers(row.original).toLocaleString(),
      },
      {
        accessorKey: "totalVideoHours",
        header: "TOTAL HOURS",
        cell: (info) => formatHours(info.getValue<number>()),
      },
      {
        accessorKey: "totalActiveHours",
        header: "TOTAL ACTIVE HOURS",
        cell: (info) => formatHours(info.getValue<number>()),
      },
      {
        accessorKey: "activeHoursPerWorker",
        header: "ACTIVE HOURS PER WORKER",
        cell: (info) => formatHours(info.getValue<number>()),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.rowKey,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 25 } },
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      <p className="text-sm text-slate-600">
        Most companies: one row per day. If the company name contains{" "}
        <span className="font-medium text-slate-800">PRABANZAN</span> or{" "}
        <span className="font-medium text-slate-800">PRABANJAN</span> (any case), sessions are split
        into ≤7 h and &gt;7 h video rows; for the &gt;7 h row only, active hours per worker is half
        of the usual average. SESSION VIDEO is “—” when there is no split.
      </p>

      <p className="text-sm font-bold text-red-600">
        Total workers are multiplied by 2 in cards with more than 7 hours of recording
      </p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md flex-1">
          <label htmlFor="company-hours-filter" className="sr-only">
            Search table
          </label>
          <input
            id="company-hours-filter"
            type="search"
            placeholder="Search…"
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
        </p>
      </div>

      <p className="text-xs text-slate-500 md:hidden" role="note">
        Scroll sideways to see all columns.
      </p>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x">
          <table className="w-full min-w-[1020px] border-collapse text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-200 bg-slate-50/90">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700"
                    >
                      {header.isPlaceholder ? null : (
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
                    No aggregated rows. Sessions need a recording, copy/paste, or written date.
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
            <span>Rows per page</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {PAGE_SIZES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button
              type="button"
              className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
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
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
