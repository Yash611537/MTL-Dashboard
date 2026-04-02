"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  updateDoc,
  type FirestoreError,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { normalizeDateToYyyyMmDd } from "@/lib/format";
import type { DailyTransferRow } from "@/types/daily-transfer";

export type DailyTransferFormValues = {
  date_on_packet: string;
  date_of_transfer: string;
  factory_name: string;
  weight_in_gram: string;
  no_of_sd_cards: string;
  average_usable_hours_mtl: string;
  average_usable_hours_client: string;
  devices_taken_from_office: string;
  devices_deployed_in_factory: string;
  headset_missing: string;
  missing_sd_cards_out_of_ddif: string;
  empty_sd_cards: string;
};

function emptyForm(): DailyTransferFormValues {
  return {
    date_on_packet: "",
    date_of_transfer: "",
    factory_name: "",
    weight_in_gram: "",
    no_of_sd_cards: "",
    average_usable_hours_mtl: "",
    average_usable_hours_client: "",
    devices_taken_from_office: "",
    devices_deployed_in_factory: "",
    headset_missing: "",
    missing_sd_cards_out_of_ddif: "",
    empty_sd_cards: "",
  };
}

function rowToForm(row: DailyTransferRow): DailyTransferFormValues {
  return {
    date_on_packet: normalizeDateToYyyyMmDd(row.date_on_packet),
    date_of_transfer: normalizeDateToYyyyMmDd(row.date_of_transfer),
    factory_name: row.factory_name ?? "",
    weight_in_gram: row.weight_in_gram != null ? String(row.weight_in_gram) : "",
    no_of_sd_cards: row.no_of_sd_cards != null ? String(row.no_of_sd_cards) : "",
    average_usable_hours_mtl:
      row.average_usable_hours_mtl != null ? String(row.average_usable_hours_mtl) : "",
    average_usable_hours_client:
      row.average_usable_hours_client != null
        ? String(row.average_usable_hours_client)
        : "",
    devices_taken_from_office:
      row.devices_taken_from_office != null ? String(row.devices_taken_from_office) : "",
    devices_deployed_in_factory:
      row.devices_deployed_in_factory != null ? String(row.devices_deployed_in_factory) : "",
    headset_missing: row.headset_missing != null ? String(row.headset_missing) : "",
    missing_sd_cards_out_of_ddif:
      row.missing_sd_cards_out_of_ddif != null ? String(row.missing_sd_cards_out_of_ddif) : "",
    empty_sd_cards: row.empty_sd_cards != null ? String(row.empty_sd_cards) : "",
  };
}

function parseOptInt(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptFloat(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

function formToPayload(f: DailyTransferFormValues): Record<string, unknown> {
  return {
    date_on_packet: f.date_on_packet.trim() || null,
    date_of_transfer: f.date_of_transfer.trim() || null,
    factory_name: f.factory_name.trim() || null,
    weight_in_gram: parseOptInt(f.weight_in_gram),
    no_of_sd_cards: f.no_of_sd_cards.trim() || null,
    average_usable_hours_mtl: f.average_usable_hours_mtl.trim() || null,
    average_usable_hours_client: parseOptFloat(f.average_usable_hours_client),
    devices_taken_from_office: parseOptInt(f.devices_taken_from_office),
    devices_deployed_in_factory: parseOptInt(f.devices_deployed_in_factory),
    headset_missing: parseOptInt(f.headset_missing),
    missing_sd_cards_out_of_ddif: parseOptInt(f.missing_sd_cards_out_of_ddif),
    empty_sd_cards: parseOptInt(f.empty_sd_cards),
  };
}

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

type Props = {
  open: boolean;
  collectionName: string;
  /** null = add new */
  editing: DailyTransferRow | null;
  onClose: () => void;
};

export function DailyTransferDialog({ open, collectionName, editing, onClose }: Props) {
  const [form, setForm] = useState<DailyTransferFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) setForm(rowToForm(editing));
    else setForm(emptyForm());
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const db = getDb();
      const payload = formToPayload(form);
      const coll = collection(db, collectionName);
      if (editing) {
        await updateDoc(doc(db, collectionName, editing.id), payload);
      } else {
        await addDoc(coll, payload);
      }
      onClose();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as FirestoreError).message)
          : "Save failed";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[min(92dvh,900px)] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="daily-transfer-dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id="daily-transfer-dialog-title"
          className="text-lg font-semibold text-slate-900"
        >
          {editing ? "Edit transfer" : "New transfer"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Dates use <span className="font-mono">YYYY-MM-DD</span>. Leave fields blank when not
          applicable.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Date on the packet
              <input
                type="date"
                className={fieldClass}
                value={form.date_on_packet}
                onChange={(e) => setForm((f) => ({ ...f, date_on_packet: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Date of transfer
              <input
                type="date"
                className={fieldClass}
                value={form.date_of_transfer}
                onChange={(e) => setForm((f) => ({ ...f, date_of_transfer: e.target.value }))}
              />
            </label>
            <label className="col-span-full block text-sm font-medium text-slate-700">
              Factory name
              <input
                type="text"
                className={fieldClass}
                value={form.factory_name}
                onChange={(e) => setForm((f) => ({ ...f, factory_name: e.target.value }))}
                placeholder="e.g. RA FASHIONS UNIT-1"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Weight in gram
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                value={form.weight_in_gram}
                onChange={(e) => setForm((f) => ({ ...f, weight_in_gram: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              No. of SD cards
              <input
                type="text"
                className={fieldClass}
                value={form.no_of_sd_cards}
                onChange={(e) => setForm((f) => ({ ...f, no_of_sd_cards: e.target.value }))}
                placeholder='e.g. 226 or "Approx 100"'
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Avg usable hours — MTL
              <input
                type="text"
                className={fieldClass}
                value={form.average_usable_hours_mtl}
                onChange={(e) =>
                  setForm((f) => ({ ...f, average_usable_hours_mtl: e.target.value }))
                }
                placeholder='e.g. 3.4h'
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Avg usable hours — client
              <input
                type="text"
                inputMode="decimal"
                className={fieldClass}
                value={form.average_usable_hours_client}
                onChange={(e) =>
                  setForm((f) => ({ ...f, average_usable_hours_client: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Devices taken from office
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                value={form.devices_taken_from_office}
                onChange={(e) =>
                  setForm((f) => ({ ...f, devices_taken_from_office: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Devices deployed in factory
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                value={form.devices_deployed_in_factory}
                onChange={(e) =>
                  setForm((f) => ({ ...f, devices_deployed_in_factory: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Headset missing
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                value={form.headset_missing}
                onChange={(e) => setForm((f) => ({ ...f, headset_missing: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Missing SD cards out of DDIF[I1]
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                value={form.missing_sd_cards_out_of_ddif}
                onChange={(e) =>
                  setForm((f) => ({ ...f, missing_sd_cards_out_of_ddif: e.target.value }))
                }
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Empty SD cards
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                value={form.empty_sd_cards}
                onChange={(e) => setForm((f) => ({ ...f, empty_sd_cards: e.target.value }))}
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 sm:w-auto"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 sm:w-auto"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
