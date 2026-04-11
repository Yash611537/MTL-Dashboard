"use client";

import { Fragment, useState } from "react";
import { useFirestoreCursorPage } from "@/hooks/use-firestore-cursor-page";
import { FIRESTORE_PAGE_SIZE } from "@/lib/firestore-page-size";

type CardStatus = "success" | "failed";

type SessionDoc = {
  id: string;
  company_name?: string;
  cycle_number?: number;
  operator_name?: string;
  card_operator_name?: string;
  ssd_id?: string;
  card_count?: number;
  wall_time_display?: string;
  wall_time_seconds?: number;
  date_of_cop_paste?: string;
  written_at_utc?: string;
  per_card_status?: Record<string, CardStatus | string>;
  per_card_duration_seconds?: Record<string, number>;
  per_card_speed_mbps?: Record<string, number>;
  per_card_note?: Record<string, string>;
};

function toMMSS(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function safeText(v: unknown): string {
  if (typeof v !== "string") return "—";
  const t = v.trim();
  return t || "—";
}

function normalizeStatus(s: unknown): string {
  return typeof s === "string" ? s.trim().toLowerCase() : "";
}

/** Empty slot: explicit status or legacy failed + zero duration (no real transfer). */
function isEmptyCard(rawStatus: unknown, durationSec: number): boolean {
  const n = normalizeStatus(rawStatus);
  if (n === "empty") return true;
  if (n === "success") return false;
  return durationSec === 0;
}

/** Real failure for session summary (not empty). */
function isRealFailure(rawStatus: unknown, durationSec: number): boolean {
  if (isEmptyCard(rawStatus, durationSec)) return false;
  return normalizeStatus(rawStatus) !== "success";
}

function sessionOverallStatus(row: SessionDoc, cardIds: string[]): "success" | "has_errors" {
  if (cardIds.length === 0) return "success";
  for (const id of cardIds) {
    const raw = row.per_card_status?.[id];
    const dur = row.per_card_duration_seconds?.[id] ?? 0;
    if (isRealFailure(raw, dur)) return "has_errors";
  }
  return "success";
}

function sessionStatusBadge(kind: "success" | "has_errors") {
  if (kind === "has_errors") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
        Has errors
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      Success
    </span>
  );
}

function cardRowStatusBadge(kind: "success" | "failed" | "empty") {
  if (kind === "empty") {
    return (
      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
        Empty
      </span>
    );
  }
  if (kind === "failed") {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
        failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      Success
    </span>
  );
}

function perCardIds(s: SessionDoc): string[] {
  const keys = new Set<string>();
  Object.keys(s.per_card_status ?? {}).forEach((k) => keys.add(k));
  Object.keys(s.per_card_duration_seconds ?? {}).forEach((k) => keys.add(k));
  Object.keys(s.per_card_speed_mbps ?? {}).forEach((k) => keys.add(k));
  Object.keys(s.per_card_note ?? {}).forEach((k) => keys.add(k));
  return Array.from(keys).sort((a, b) => a.localeCompare(b));
}

export function SessionTable() {
  const {
    rows,
    pageIndex,
    setPageIndex,
    loading,
    pageLoading,
    error,
    pageCount,
  } = useFirestoreCursorPage<SessionDoc>({
    collectionPath: "CYCLE_DATA",
    orderByField: "written_at_utc",
    orderDirection: "desc",
    mapDoc: (id, data) => ({ ...(data as Omit<SessionDoc, "id">), id }),
  });
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const hasRows = rows.length > 0;
  const canGoNext = pageIndex + 1 < pageCount;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20 sm:text-base">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          Loading cycle sessions from Firestore...
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
    <div className="space-y-3 sm:space-y-4">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch] touch-pan-x">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="w-10 px-3 py-2.5" aria-label="Expand row" />
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                  COMPANY NAME
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                  CYCLE #
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                  Date
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                  Card Operator
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                  Card Count
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                  WALL TIME
                </th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">SSD ID</th>
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!hasRows ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-slate-500">
                    No cycle sessions found in CYCLE_DATA.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const cards = perCardIds(row);
                  const sStatus = sessionOverallStatus(row, cards);
                  const expanded = expandedRowId === row.id;
                  const cycleNumber =
                    typeof row.cycle_number === "number" ? String(row.cycle_number) : "—";
                  const cardCount =
                    typeof row.card_count === "number" ? row.card_count.toLocaleString() : "—";
                  const dateDisplay = safeText(row.date_of_cop_paste);

                  return (
                    <Fragment key={row.id}>
                      <tr
                        className="cursor-pointer bg-white transition-colors hover:bg-slate-50/80"
                        onClick={() => setExpandedRowId((prev) => (prev === row.id ? null : row.id))}
                      >
                        <td className="px-3 py-2 text-slate-500">
                          <svg
                            className={`h-4 w-4 transition-transform ${expanded ? "rotate-90" : ""}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path
                              fillRule="evenodd"
                              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {safeText(row.company_name)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">{cycleNumber}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {dateDisplay}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {safeText(row.card_operator_name)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">{cardCount}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {safeText(row.wall_time_display)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {safeText(row.ssd_id)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2">{sessionStatusBadge(sStatus)}</td>
                      </tr>
                      {expanded ? (
                        <tr className="bg-slate-50/70">
                          <td colSpan={9} className="px-3 py-3">
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                              <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] border-collapse text-left text-xs sm:text-sm">
                                  <thead className="border-b border-slate-200 bg-slate-50/90">
                                    <tr>
                                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                                        Card ID
                                      </th>
                                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                                        Duration (MM:SS)
                                      </th>
                                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                                        Speed MB/s
                                      </th>
                                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                                        Note
                                      </th>
                                      <th className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                                        Status
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                    {cards.length === 0 ? (
                                      <tr>
                                        <td colSpan={5} className="px-3 py-5 text-center text-slate-500">
                                          No card-level details for this session.
                                        </td>
                                      </tr>
                                    ) : (
                                      cards.map((cardId) => {
                                        const rawStatus = row.per_card_status?.[cardId];
                                        const durationSec = row.per_card_duration_seconds?.[cardId] ?? 0;
                                        const empty = isEmptyCard(rawStatus, durationSec);
                                        const cardKind: "success" | "failed" | "empty" = empty
                                          ? "empty"
                                          : normalizeStatus(rawStatus) === "success"
                                            ? "success"
                                            : "failed";
                                        const speed = row.per_card_speed_mbps?.[cardId];
                                        const note = row.per_card_note?.[cardId];
                                        const hidePerf = empty;
                                        const speedDisplay =
                                          hidePerf || typeof speed !== "number"
                                            ? "—"
                                            : speed.toLocaleString(undefined, {
                                                maximumFractionDigits: 2,
                                              });

                                        return (
                                          <tr key={`${row.id}-${cardId}`} className="bg-white">
                                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                                              {cardId}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                                              {hidePerf ? "—" : toMMSS(durationSec)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                                              {speedDisplay}
                                            </td>
                                            <td className="px-3 py-2 text-slate-700">
                                              {safeText(note)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-2">
                                              {cardRowStatusBadge(cardKind)}
                                            </td>
                                          </tr>
                                        );
                                      })
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50/50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {FIRESTORE_PAGE_SIZE} sessions per request · Page {pageIndex + 1} of {pageCount || 1}
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
    </div>
  );
}
