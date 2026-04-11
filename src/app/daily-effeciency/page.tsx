"use client";

import { useMemo } from "react";
import { Header } from "@/components/header";
import { useSdCardsAccumulatedBatches } from "@/hooks/use-sd-cards-accumulated-batches";
import { FIRESTORE_PAGE_SIZE } from "@/lib/firestore-page-size";
import { normalizeDateToYyyyMmDd } from "@/lib/format";
import { sdCardsCollectionName } from "@/lib/sd-cards-collection";
import type { SdCardRow } from "@/types/sd-card";

function collectionName(): string {
  return sdCardsCollectionName();
}

function isTrueLike(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (typeof v === "string") {
    const t = v.trim().toLowerCase();
    return t === "true" || t === "1" || t === "yes";
  }
  return false;
}

type DailyAggregate = {
  dateKey: string;
  cardsRead: number;
  emptyCardsFound: number;
  /** Card operator names for that day */
  cardOperatorName: string;
  transferCount: number;
};

function aggregateByStorageDay(rows: SdCardRow[]): DailyAggregate[] {
  const map = new Map<
    string,
    { cards: number; empty: number; ops: Set<string>; count: number }
  >();

  for (const r of rows) {
    const dateKey = normalizeDateToYyyyMmDd(r.date_of_cop_paste);
    if (!dateKey) continue;

    const cur = map.get(dateKey) ?? {
      cards: 0,
      empty: 0,
      ops: new Set<string>(),
      count: 0,
    };
    // One SD_CARDS row is one processed card session.
    cur.cards += 1;
    if (isTrueLike(r.empty_card)) cur.empty += 1;
    const op = (r.card_operator_name ?? "").trim();
    if (op) cur.ops.add(op);
    cur.count += 1;
    map.set(dateKey, cur);
  }

  return Array.from(map.entries())
    .map(([dateKey, v]) => ({
      dateKey,
      cardsRead: v.cards,
      emptyCardsFound: v.empty,
      cardOperatorName:
        v.ops.size === 0 ? "—" : Array.from(v.ops).sort((a, b) => a.localeCompare(b)).join(", "),
      transferCount: v.count,
    }))
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export default function DailyEffeciencyPage() {
  const coll = collectionName();
  const {
    rowsForAggregate: rows,
    loading,
    fetchingMore,
    error,
    goNext,
    goPrev,
    canGoNext,
    canGoPrev,
    recordCount,
  } = useSdCardsAccumulatedBatches();

  const byDay = useMemo(() => aggregateByStorageDay(rows), [rows]);

  const today = todayKey();
  const yesterday = yesterdayKey();
  const todayAgg = useMemo(
    () => byDay.find((d) => d.dateKey === today),
    [byDay, today]
  );
  const yesterdayAgg = useMemo(
    () => byDay.find((d) => d.dateKey === yesterday),
    [byDay, yesterday]
  );

  return (
    <>
      <Header
        title="Daily Effeciency"
        subtitle={`Per day by SD_CARDS date of copy paste (${coll}). Data loads in batches of 25 documents.`}
      />
      <main className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            Showing totals from up to{" "}
            <span className="font-semibold text-slate-900">{recordCount.toLocaleString()}</span>{" "}
            SD card record{recordCount !== 1 ? "s" : ""} ({FIRESTORE_PAGE_SIZE} per Firestore step).
            Use Next to include more.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canGoPrev || fetchingMore}
              onClick={goPrev}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!canGoNext || fetchingMore}
              onClick={goNext}
            >
              {fetchingMore ? "Loading…" : "Next"}
            </button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Today ({today})</p>
            {todayAgg ? (
              <p className="mt-1 text-sm text-slate-700">
                Cards read: <span className="font-semibold">{todayAgg.cardsRead.toLocaleString()}</span>{" "}
                · Empty cards found:{" "}
                <span className="font-semibold">{todayAgg.emptyCardsFound.toLocaleString()}</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-700">
                No SD_CARDS rows in the loaded sample for today.
              </p>
            )}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Yesterday ({yesterday})</p>
            {yesterdayAgg ? (
              <p className="mt-1 text-sm text-slate-700">
                Cards read:{" "}
                <span className="font-semibold">{yesterdayAgg.cardsRead.toLocaleString()}</span> ·
                Empty cards found:{" "}
                <span className="font-semibold">
                  {yesterdayAgg.emptyCardsFound.toLocaleString()}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-amber-700">
                No SD_CARDS rows in the loaded sample for yesterday.
              </p>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20 sm:text-base">
            <div className="flex items-center gap-3">
              <span
                className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
                aria-hidden
              />
              Loading daily efficiency…
            </div>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-900">
            <p className="font-medium">Could not load data</p>
            <p className="mt-1 text-red-800">{error}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      DATE OF COPY PASTE
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      CARDS READ (DAY TOTAL)
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      EMPTY CARDS FOUND (DAY TOTAL)
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      CARD OPERATOR NAME
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {byDay.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-12 text-center text-slate-500">
                        No SD_CARDS rows with a valid copy-paste date in the loaded sample.
                      </td>
                    </tr>
                  ) : (
                    byDay.map((d) => (
                      <tr
                        key={d.dateKey}
                        className={`transition-colors hover:bg-slate-50/80 ${
                          d.dateKey === today ? "bg-emerald-50/40" : "bg-white"
                        }`}
                      >
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">{d.dateKey}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {d.cardsRead.toLocaleString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {d.emptyCardsFound.toLocaleString()}
                        </td>
                        <td className="max-w-[280px] px-3 py-2 text-slate-700">
                          <span className="line-clamp-2" title={d.cardOperatorName}>
                            {d.cardOperatorName}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
              Each row is one calendar day by date of copy paste. Numbers reflect only SD_CARDS
              records included via the steps above (not necessarily the full collection).
            </p>
          </div>
        )}
      </main>
    </>
  );
}
