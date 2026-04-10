"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import {
  addEntry,
  getEntries,
  type InventoryEntry,
  type InventoryEntryInput,
  type PackageType,
} from "@/lib/inventoryService";

type InventoryFormState = {
  packageType: PackageType;
  dispatchId: string;
  linkedDispatchId: string;
  date: string;
  factoryName: string;
  warehouseCity: string;
  warehouseOperator: string;
  factoryOperator: string;
  cardsWeightGrams: string;
  cardsTotalCards: string;
  cardsFilledCards: string;
  cardsDeployed: string;
  devicesCount: string;
  devicesType: string;
  devicesDeployed: string;
  chargersCount: string;
  chargersType: string;
  chargersPorts: string;
  others: string;
};

function todayYyyyMmDd(): string {
  return new Date().toISOString().slice(0, 10);
}

function initialFormState(): InventoryFormState {
  return {
    packageType: "Dispatch",
    dispatchId: "",
    linkedDispatchId: "",
    date: todayYyyyMmDd(),
    factoryName: "",
    warehouseCity: "",
    warehouseOperator: "",
    factoryOperator: "",
    cardsWeightGrams: "",
    cardsTotalCards: "",
    cardsFilledCards: "",
    cardsDeployed: "",
    devicesCount: "",
    devicesType: "",
    devicesDeployed: "",
    chargersCount: "",
    chargersType: "",
    chargersPorts: "",
    others: "",
  };
}

function parseNonNegativeNumber(v: string): number {
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

function makeDispatchId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `DSP-${y}${m}${day}-${suffix}`;
}

function toPayload(form: InventoryFormState): InventoryEntryInput {
  return {
    packageType: form.packageType,
    dispatchId: form.packageType === "Dispatch" ? form.dispatchId.trim() : "",
    linkedDispatchId: form.packageType === "Return" ? form.linkedDispatchId.trim() : "",
    date: form.date,
    factoryName: form.factoryName.trim(),
    warehouseCity: form.warehouseCity.trim(),
    warehouseOperator: form.warehouseOperator.trim(),
    factoryOperator: form.factoryOperator.trim(),
    inventory: {
      cards: {
        weightGrams: parseNonNegativeNumber(form.cardsWeightGrams),
        totalCards: parseNonNegativeNumber(form.cardsTotalCards),
        filledCards: parseNonNegativeNumber(form.cardsFilledCards),
        cardsDeployed: parseNonNegativeNumber(form.cardsDeployed),
      },
      devices: {
        count: parseNonNegativeNumber(form.devicesCount),
        type: form.devicesType.trim(),
        devicesDeployed: parseNonNegativeNumber(form.devicesDeployed),
      },
      chargers: {
        count: parseNonNegativeNumber(form.chargersCount),
        type: form.chargersType.trim(),
        ports: parseNonNegativeNumber(form.chargersPorts),
      },
      others: form.others.trim(),
    },
  };
}

function HelpTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <span className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500">
        ?
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-72 -translate-x-1/2 rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
        {text}
      </span>
    </span>
  );
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

export default function InventoryManagementFormPage() {
  const [form, setForm] = useState<InventoryFormState>(initialFormState);
  const [entries, setEntries] = useState<InventoryEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const rows = await getEntries();
        if (!cancelled) setEntries(rows);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dispatch ids.");
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

  const dispatchEntries = useMemo(
    () => entries.filter((e) => e.packageType === "Dispatch" && !!e.dispatchId),
    [entries]
  );

  const selectedDispatch = useMemo(
    () => dispatchEntries.find((e) => e.dispatchId === form.linkedDispatchId),
    [dispatchEntries, form.linkedDispatchId]
  );

  const canSave = useMemo(() => {
    if (saving) return false;
    if (!form.date.trim() || !form.factoryName.trim()) return false;
    if (!form.warehouseCity.trim()) return false;
    if (!form.warehouseOperator.trim()) return false;
    if (!form.factoryOperator.trim()) return false;
    if (form.packageType === "Dispatch" && !form.dispatchId.trim()) return false;
    if (form.packageType === "Return" && !form.linkedDispatchId.trim()) return false;
    return true;
  }, [form, saving]);

  function clearForm() {
    const next = initialFormState();
    next.dispatchId = makeDispatchId();
    setForm(next);
  }

  useEffect(() => {
    setForm((f) => {
      if (f.packageType === "Dispatch" && !f.dispatchId.trim()) {
        return { ...f, dispatchId: makeDispatchId() };
      }
      return f;
    });
  }, [form.packageType]);

  function handleSelectDispatchId(id: string) {
    const match = dispatchEntries.find((d) => d.dispatchId === id);
    setForm((f) => ({
      ...f,
      linkedDispatchId: id,
      factoryName: match?.factoryName ?? f.factoryName,
      warehouseCity: match?.warehouseCity ?? f.warehouseCity,
      warehouseOperator: match?.warehouseOperator ?? f.warehouseOperator,
      factoryOperator: match?.factoryOperator ?? f.factoryOperator,
      cardsWeightGrams: match ? String(match.inventory?.cards?.weightGrams ?? 0) : f.cardsWeightGrams,
      cardsTotalCards: match ? String(match.inventory?.cards?.totalCards ?? 0) : f.cardsTotalCards,
      cardsFilledCards: match
        ? String(match.inventory?.cards?.filledCards ?? 0)
        : f.cardsFilledCards,
      cardsDeployed: match
        ? String(match.inventory?.cards?.cardsDeployed ?? 0)
        : f.cardsDeployed,
      devicesCount: match ? String(match.inventory?.devices?.count ?? 0) : f.devicesCount,
      devicesType: match?.inventory?.devices?.type ?? f.devicesType,
      devicesDeployed: match
        ? String(match.inventory?.devices?.devicesDeployed ?? 0)
        : f.devicesDeployed,
      chargersCount: match ? String(match.inventory?.chargers?.count ?? 0) : f.chargersCount,
      chargersType: match?.inventory?.chargers?.type ?? f.chargersType,
      chargersPorts: match ? String(match.inventory?.chargers?.ports ?? 0) : f.chargersPorts,
      others: match?.inventory?.others ?? f.others,
    }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      await addEntry(toPayload(form));
      clearForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header
        title="Inventory management form"
        subtitle="Log and track dispatch / return packages"
      />
      <main className="flex flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex justify-end">
          <Link
            href="/inventory-management"
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View table
          </Link>
        </div>

        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-none">
          <h2 className="text-base font-semibold text-slate-900">Create inventory entry</h2>
          <form className="mt-4 space-y-5" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <label className="block text-sm font-medium text-slate-700">
                Package type *
                <select
                  required
                  className={fieldClass}
                  value={form.packageType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, packageType: e.target.value as PackageType }))
                  }
                >
                  <option value="Dispatch">Dispatch</option>
                  <option value="Return">Return</option>
                </select>
              </label>

              {form.packageType === "Dispatch" ? (
                <label className="block text-sm font-medium text-slate-700">
                  Dispatch ID *
                  <input
                    type="text"
                    required
                    className={fieldClass}
                    value={form.dispatchId}
                    onChange={(e) => setForm((f) => ({ ...f, dispatchId: e.target.value }))}
                  />
                </label>
              ) : (
                <label className="block text-sm font-medium text-slate-700">
                  <span className="inline-flex items-center gap-1.5">
                    Dispatch ID *
                    <HelpTip
                      text={
                        selectedDispatch
                          ? `Factory: ${selectedDispatch.factoryName || "—"} | Date: ${
                              selectedDispatch.date || "—"
                            } | City: ${selectedDispatch.warehouseCity || "—"} | Wh: ${
                              selectedDispatch.warehouseOperator || "—"
                            } | Fac: ${
                              selectedDispatch.factoryOperator || "—"
                            }`
                          : "Select a previous dispatch ID to auto-fill details."
                      }
                    />
                  </span>
                  <input
                    type="text"
                    list="dispatch-id-options"
                    required
                    className={fieldClass}
                    value={form.linkedDispatchId}
                    onChange={(e) => handleSelectDispatchId(e.target.value)}
                    placeholder={loading ? "Loading dispatch ids..." : "Type or select dispatch id"}
                  />
                  <datalist id="dispatch-id-options">
                    {dispatchEntries.map((entry) => (
                      <option key={entry.id} value={entry.dispatchId} />
                    ))}
                  </datalist>
                </label>
              )}

              <label className="block text-sm font-medium text-slate-700">
                Date *
                <input
                  type="date"
                  required
                  className={fieldClass}
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Factory name *
                <input
                  type="text"
                  required
                  className={fieldClass}
                  value={form.factoryName}
                  onChange={(e) => setForm((f) => ({ ...f, factoryName: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Warehouse city *
                <input
                  type="text"
                  required
                  className={fieldClass}
                  value={form.warehouseCity}
                  onChange={(e) => setForm((f) => ({ ...f, warehouseCity: e.target.value }))}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  Warehouse operator *
                  <HelpTip text="Person from warehouse who authorized this package" />
                </span>
                <input
                  type="text"
                  required
                  className={fieldClass}
                  value={form.warehouseOperator}
                  onChange={(e) => setForm((f) => ({ ...f, warehouseOperator: e.target.value }))}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                <span className="inline-flex items-center gap-1.5">
                  Factory operator *
                  <HelpTip text="Person who will carry the package to the factory" />
                </span>
                <input
                  type="text"
                  required
                  className={fieldClass}
                  value={form.factoryOperator}
                  onChange={(e) => setForm((f) => ({ ...f, factoryOperator: e.target.value }))}
                />
              </label>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-900">Name of inventory</h3>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold text-slate-900">Part 1 · Cards</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <label className="text-sm font-medium text-slate-700">
                      Weight (grams)
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.cardsWeightGrams}
                        onChange={(e) => setForm((f) => ({ ...f, cardsWeightGrams: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      No. of cards
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.cardsTotalCards}
                        onChange={(e) => setForm((f) => ({ ...f, cardsTotalCards: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Filled cards
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.cardsFilledCards}
                        onChange={(e) => setForm((f) => ({ ...f, cardsFilledCards: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Cards deployed
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.cardsDeployed}
                        onChange={(e) => setForm((f) => ({ ...f, cardsDeployed: e.target.value }))}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold text-slate-900">Part 2 · Devices</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700">
                      No. of devices
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.devicesCount}
                        onChange={(e) => setForm((f) => ({ ...f, devicesCount: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Type e.g. Camera, Hub
                      <input
                        type="text"
                        className={fieldClass}
                        value={form.devicesType}
                        onChange={(e) => setForm((f) => ({ ...f, devicesType: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Devices deployed
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.devicesDeployed}
                        onChange={(e) => setForm((f) => ({ ...f, devicesDeployed: e.target.value }))}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold text-slate-900">Part 3 · Chargers</h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <label className="text-sm font-medium text-slate-700">
                      No. of chargers
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.chargersCount}
                        onChange={(e) => setForm((f) => ({ ...f, chargersCount: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      Type e.g. GaN, USB-C
                      <input
                        type="text"
                        className={fieldClass}
                        value={form.chargersType}
                        onChange={(e) => setForm((f) => ({ ...f, chargersType: e.target.value }))}
                      />
                    </label>
                    <label className="text-sm font-medium text-slate-700">
                      No. of ports
                      <input
                        type="number"
                        min={0}
                        className={fieldClass}
                        value={form.chargersPorts}
                        onChange={(e) => setForm((f) => ({ ...f, chargersPorts: e.target.value }))}
                      />
                    </label>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <h4 className="text-sm font-semibold text-slate-900">Part 4 · Others</h4>
                  <label className="mt-3 block text-sm font-medium text-slate-700">
                    Other items
                    <textarea
                      rows={5}
                      className={fieldClass}
                      value={form.others}
                      onChange={(e) => setForm((f) => ({ ...f, others: e.target.value }))}
                    />
                  </label>
                </div>
              </div>
            </div>

            {error ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={clearForm}
                disabled={saving}
              >
                Clear
              </button>
              <button
                type="submit"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
                disabled={!canSave}
              >
                {saving ? "Saving..." : "Save entry"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </>
  );
}
