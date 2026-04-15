"use client";

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
import { normalizeDateToYyyyMmDd, toNumber } from "@/lib/format";
import { getDb } from "@/lib/firebase";
import type { CompanyHoursSummaryRow } from "@/types/company-hours";
import { CompanyHoursTable } from "./company-hours-table";

type CompanyHoursSummaryDoc = {
  company_name?: unknown;
  date_of_recording?: unknown;
  no_of_workers?: unknown;
  total_hours?: unknown;
  usable_hours?: unknown;
};

function normalizedCompanyChars(name: string): string {
  return name.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function companyDisplayName(name: string): string {
  const cleaned = name.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  if (!cleaned) return "—";
  return cleaned.toUpperCase();
}

function toSafeNumber(value: unknown): number {
  return toNumber(value) ?? 0;
}

function toSafeWorkers(value: unknown): number {
  const n = toNumber(value);
  if (n == null) return 0;
  return Math.max(0, Math.floor(n));
}

export function CompanyHoursPanel() {
  const [rows, setRows] = useState<CompanyHoursSummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const db = getDb();
      const ref = collection(db, "company_hours_summary");
      const q = query(ref, orderBy("date_of_recording", "desc"));
      const snap = await getDocs(q);
      const merged = new Map<
        string,
        {
          dateKey: string;
          companyName: string;
          workers: number;
          totalHours: number;
          usableHours: number;
        }
      >();

      for (const doc of snap.docs) {
        const data = doc.data() as CompanyHoursSummaryDoc;
        const dateKey = normalizeDateToYyyyMmDd(data.date_of_recording);
        if (!dateKey) continue;

        const rawCompany = String(data.company_name ?? "").trim();
        const displayName = companyDisplayName(rawCompany);
        const normalizedName = normalizedCompanyChars(rawCompany);
        const identityName = normalizedName || normalizedCompanyChars(displayName) || "UNKNOWN";
        const mergeKey = `${dateKey}\0${identityName}`;

        const workers = toSafeWorkers(data.no_of_workers);
        const totalHours = toSafeNumber(data.total_hours);
        const usableHours = toSafeNumber(data.usable_hours);

        const current = merged.get(mergeKey);
        if (current) {
          current.workers += workers;
          current.totalHours += totalHours;
          current.usableHours += usableHours;
        } else {
          merged.set(mergeKey, {
            dateKey,
            companyName: displayName,
            workers,
            totalHours,
            usableHours,
          });
        }
      }

      const next: CompanyHoursSummaryRow[] = Array.from(merged.values())
        .map((v) => ({
          rowKey: `${v.dateKey}\0${normalizedCompanyChars(v.companyName)}`,
          dateKey: v.dateKey,
          companyName: v.companyName,
          totalWorkers: v.workers,
          totalHours: v.totalHours,
          totalUsableHours: v.usableHours,
          goodPerPerson: v.workers > 0 ? v.usableHours / v.workers : 0,
        }))
        .sort((a, b) => {
          const dateCmp = b.dateKey.localeCompare(a.dateKey);
          if (dateCmp !== 0) return dateCmp;
          return a.companyName.localeCompare(b.companyName, undefined, {
            sensitivity: "base",
          });
        });

      setRows(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load company_hours_summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20 sm:text-base">
        <div className="flex items-center gap-3">
          <span
            className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          Loading company hours summary from Firestore…
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
    <CompanyHoursTable data={rows} />
  );
}
