"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { Header } from "@/components/header";
import { getEntries, type InventoryEntry, type PackageType } from "@/lib/inventoryService";

function TypeBadge({ type }: { type: PackageType }) {
  if (type === "Dispatch") {
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
        Dispatch
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
      Return
    </span>
  );
}

export default function InventoryManagementPage() {
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const rows = await getEntries();
        if (!cancelled) setEntries(rows);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load inventory entries.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Header
        title="Inventory management"
        subtitle="Track dispatch / return packages (table view)"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex justify-end">
          <Link
            href="/Inventory-management-form"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Add inventory entry
          </Link>
        </div>

        {error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="overflow-hidden rounded-xl border border-gray-100 bg-white">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-slate-500">
              Loading inventory entries...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90">
                    <th className="w-10 px-3 py-2.5" />
                    <th className="px-3 py-2.5 font-semibold text-slate-700">Type</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-700">Dispatch ID</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-700">Date</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-700">Factory</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-700">Wh. operator</th>
                    <th className="px-3 py-2.5 font-semibold text-slate-700">Fac. operator</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-12 text-center text-slate-500">
                        No inventory entries yet.
                      </td>
                    </tr>
                  ) : (
                    entries.map((entry) => {
                      const expanded = expandedRowId === entry.id;
                      const cards = entry.inventory?.cards ?? {
                        weightGrams: 0,
                        totalCards: 0,
                        filledCards: 0,
                        cardsDeployed: 0,
                      };
                      const devices = entry.inventory?.devices ?? {
                        count: 0,
                        type: "",
                        devicesDeployed: 0,
                      };
                      const chargers = entry.inventory?.chargers ?? { count: 0, type: "", ports: 0 };
                      const dispatchId = entry.dispatchId || entry.linkedDispatchId || "—";

                      return (
                        <Fragment key={entry.id}>
                          <tr
                            className="cursor-pointer transition-colors hover:bg-slate-50/70"
                            onClick={() =>
                              setExpandedRowId((prev) => (prev === entry.id ? null : entry.id ?? null))
                            }
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
                            <td className="whitespace-nowrap px-3 py-2">
                              <TypeBadge type={entry.packageType} />
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">{dispatchId}</td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                              {entry.date || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                              {entry.factoryName || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                              {entry.warehouseOperator || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-800">
                              {entry.factoryOperator || "—"}
                            </td>
                          </tr>
                          {expanded ? (
                            <tr className="bg-gray-50">
                              <td colSpan={7} className="px-3 py-3">
                                <div className="grid gap-3 md:grid-cols-2">
                                  <div className="rounded-lg border border-gray-100 bg-white p-3">
                                    <p className="text-xs text-slate-500">Cards</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                      Weight: {cards.weightGrams}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Total cards: {cards.totalCards}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Filled cards: {cards.filledCards}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Cards deployed: {cards.cardsDeployed ?? 0}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-gray-100 bg-white p-3">
                                    <p className="text-xs text-slate-500">Devices</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                      Count: {devices.count}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Type: {devices.type || "—"}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Devices deployed: {devices.devicesDeployed ?? 0}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-gray-100 bg-white p-3">
                                    <p className="text-xs text-slate-500">Chargers</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                      Count: {chargers.count}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Type: {chargers.type || "—"}
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                      Ports: {chargers.ports}
                                    </p>
                                  </div>
                                  <div className="rounded-lg border border-gray-100 bg-white p-3">
                                    <p className="text-xs text-slate-500">Others</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                      {entry.inventory?.others || "—"}
                                    </p>
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
          )}
        </section>
      </main>
    </>
  );
}
