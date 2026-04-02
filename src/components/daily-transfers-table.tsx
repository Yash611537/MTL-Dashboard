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
import { formatDailyTransferDateCell, normalizeDateToYyyyMmDd } from "@/lib/format";
import type { DailyTransferRow } from "@/types/daily-transfer";

const PAGE_SIZES = [10, 25, 50, 100] as const;

function cellStr(v: unknown): string {
  if (v == null || v === "") return "—";
  return String(v);
}

function globalFilterFn(
  row: { original: DailyTransferRow },
  _columnId: string,
  filterValue: string
) {
  const q = filterValue.trim().toLowerCase();
  if (!q) return true;
  const r = row.original;
  const parts = [
    formatDailyTransferDateCell(r.date_on_packet),
    formatDailyTransferDateCell(r.date_of_transfer),
    r.factory_name,
    r.weight_in_gram != null ? String(r.weight_in_gram) : "",
    r.no_of_sd_cards != null ? String(r.no_of_sd_cards) : "",
    r.average_usable_hours_mtl != null ? String(r.average_usable_hours_mtl) : "",
    r.average_usable_hours_client != null ? String(r.average_usable_hours_client) : "",
    r.devices_taken_from_office != null ? String(r.devices_taken_from_office) : "",
    r.devices_deployed_in_factory != null ? String(r.devices_deployed_in_factory) : "",
    r.headset_missing != null ? String(r.headset_missing) : "",
    r.missing_sd_cards_out_of_ddif != null ? String(r.missing_sd_cards_out_of_ddif) : "",
    r.empty_sd_cards != null ? String(r.empty_sd_cards) : "",
  ];
  return parts.some((p) => String(p ?? "").toLowerCase().includes(q));
}

function dateSortKey(v: unknown): number {
  const ymd = normalizeDateToYyyyMmDd(v);
  if (!ymd) return 0;
  const t = new Date(ymd + "T00:00:00").getTime();
  return Number.isNaN(t) ? 0 : t;
}

type Props = {
  data: DailyTransferRow[];
  onAdd: () => void;
  onEdit: (row: DailyTransferRow) => void;
  onDelete: (row: DailyTransferRow) => void | Promise<void>;
  deletingId?: string | null;
};

export function DailyTransfersTable({
  data,
  onAdd,
  onEdit,
  onDelete,
  deletingId,
}: Props) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "date_on_packet", desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const columns = useMemo<ColumnDef<DailyTransferRow>[]>(
    () => [
      {
        id: "actions",
        header: "",
        enableSorting: false,
        enableGlobalFilter: false,
        cell: ({ row }) => {
          const busy = deletingId === row.original.id;
          return (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 transition hover:bg-brand-50 hover:text-brand-700"
                title="Edit"
                aria-label="Edit row"
                onClick={() => onEdit(row.original)}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
                  />
                  <path
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                title="Delete row"
                aria-label="Delete row"
                disabled={busy}
                onClick={() => {
                  const label =
                    row.original.factory_name?.trim() ||
                    formatDailyTransferDateCell(row.original.date_on_packet) ||
                    "this row";
                  if (
                    typeof window !== "undefined" &&
                    window.confirm(`Delete ${label}? This cannot be undone.`)
                  ) {
                    void onDelete(row.original);
                  }
                }}
              >
                {busy ? (
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"
                    aria-hidden
                  />
                ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          );
        },
      },
      {
        id: "date_on_packet",
        accessorFn: (row) => row.date_on_packet,
        header: () => (
          <span title="Date on the packet">Packet date</span>
        ),
        cell: ({ row }) => formatDailyTransferDateCell(row.original.date_on_packet),
        sortingFn: (a, b) =>
          dateSortKey(a.original.date_on_packet) - dateSortKey(b.original.date_on_packet),
      },
      {
        id: "date_of_transfer",
        accessorFn: (row) => row.date_of_transfer,
        header: () => <span title="DATE OF TRANSFER">Transfer date</span>,
        cell: ({ row }) => formatDailyTransferDateCell(row.original.date_of_transfer),
        sortingFn: (a, b) =>
          dateSortKey(a.original.date_of_transfer) - dateSortKey(b.original.date_of_transfer),
      },
      {
        accessorKey: "factory_name",
        header: () => <span title="FACTORY NAME">Factory</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "weight_in_gram",
        header: () => <span title="WEIGHT IN GRAM">Weight (g)</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "no_of_sd_cards",
        header: () => <span title="NO. OF SD CARDS">SD cards #</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "average_usable_hours_mtl",
        header: () => <span title="AVERAGE USABLE HOURS - MTL">Avg hrs — MTL</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "average_usable_hours_client",
        header: () => <span title="AVERAGE USABLE HOURS - CLIENT">Avg hrs — client</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "devices_taken_from_office",
        header: () => <span title="DEVICES TAKEN FROM OFFICE">From office</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "devices_deployed_in_factory",
        header: () => <span title="DEVICES DEPLOYED IN FACTORY">In factory</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "headset_missing",
        header: () => <span title="HEADSET MISSING">Headset Δ</span>,
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "missing_sd_cards_out_of_ddif",
        header: () => (
          <span title="MISSING SD CARDS OUT OF DDIF[I1]">Missing SD (DDIF)</span>
        ),
        cell: (info) => cellStr(info.getValue()),
      },
      {
        accessorKey: "empty_sd_cards",
        header: () => <span title="Empty SD Cards">Empty SD</span>,
        cell: (info) => cellStr(info.getValue()),
      },
    ],
    [onEdit, onDelete, deletingId]
  );

  const table = useReactTable({
    data,
    columns,
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-md flex-1">
            <label htmlFor="dt-global-filter" className="sr-only">
              Search table
            </label>
            <input
              id="dt-global-filter"
              type="search"
              placeholder="Search…"
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pl-9 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 sm:w-auto"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add entry
          </button>
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
          <table className="w-full min-w-[1420px] border-collapse text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-slate-200 bg-sky-50/90">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="whitespace-nowrap px-2 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-700"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-left hover:bg-sky-100/80"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: " ↑",
                            desc: " ↓",
                          }[header.column.getIsSorted() as string] ?? null}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
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
                    No rows yet. Use &quot;Add entry&quot; to create one.
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white transition-colors hover:bg-slate-50/80"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-2 py-2 text-slate-800">
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
