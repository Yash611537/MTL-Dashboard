"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { normalizeDateToYyyyMmDd } from "@/lib/format";
import { getDb } from "@/lib/firebase";

type DailyEfficiencyRow = {
  rowKey: string;
  dateKey: string;
  numberOfCards: number;
  cardOperators: string;
};

function toNumberOrZero(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function cardOperatorsLabel(v: unknown): string {
  if (Array.isArray(v)) {
    const names = v
      .map((item) => String(item ?? "").trim())
      .filter(Boolean);
    return names.length ? names.join(", ") : "—";
  }
  const single = String(v ?? "").trim();
  return single || "—";
}

export default function DailyEffeciencyPage() {
  const [rows, setRows] = useState<DailyEfficiencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const db = getDb();
        const ref = collection(db, "daily_efficiency");
        const q = query(ref, orderBy("date_of_copy_paste", "desc"));
        const snap = await getDocs(q);

        const next: DailyEfficiencyRow[] = snap.docs.map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const dateKey = normalizeDateToYyyyMmDd(
            data.date_of_copy_paste ?? data.date_of_transfer
          );
          const numberOfCards = toNumberOrZero(
            data.cards_read ?? data.number_of_cards ?? data.no_of_cards
          );

          return {
            rowKey: doc.id,
            dateKey: dateKey || "—",
            numberOfCards,
            cardOperators: cardOperatorsLabel(data.card_operators),
          };
        });

        setRows(next);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load daily_efficiency");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const tableRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        if (a.dateKey === "—" && b.dateKey === "—") return 0;
        if (a.dateKey === "—") return 1;
        if (b.dateKey === "—") return -1;
        return b.dateKey.localeCompare(a.dateKey);
      }),
    [rows]
  );

  return (
    <>
      <Header
        title="Daily Effeciency"
        subtitle="Table from daily_efficiency collection."
      />
      <main className="flex flex-1 flex-col px-4 py-4 sm:px-6 sm:py-6">
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
              <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      DATE OF TRANSFER
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      NUMBER OF CARDS
                    </th>
                    <th className="whitespace-nowrap px-3 py-2.5 font-semibold text-slate-700">
                      CARD OPERATOR
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-12 text-center text-slate-500">
                        No daily efficiency rows found.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((d) => (
                      <tr key={d.rowKey} className="bg-white transition-colors hover:bg-slate-50/80">
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">{d.dateKey}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                          {d.numberOfCards.toLocaleString()}
                        </td>
                        <td className="max-w-[280px] px-3 py-2 text-slate-700">
                          <span className="line-clamp-2" title={d.cardOperators}>
                            {d.cardOperators}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
