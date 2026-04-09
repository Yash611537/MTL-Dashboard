"use client";

import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  type FirestoreError,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import { sdCardsCollectionName } from "@/lib/sd-cards-collection";

type Props = {
  open: boolean;
  onClose: () => void;
};

type FormValues = {
  companyName: string;
  recordingDate: string;
  totalVideoHours: string;
  idleDuration: string;
  deviceId: string;
  operatorName: string;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

function emptyForm(): FormValues {
  return {
    companyName: "",
    recordingDate: "",
    totalVideoHours: "",
    idleDuration: "",
    deviceId: "",
    operatorName: "",
  };
}

function parseOptNumber(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

export function CompanyHoursAddDialog({ open, onClose }: Props) {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const companyName = form.companyName.trim();
    if (!companyName) {
      setError("Company name is required.");
      return;
    }
    if (!form.recordingDate.trim()) {
      setError("Date is required.");
      return;
    }
    const totalVideoHours = parseOptNumber(form.totalVideoHours);
    if (totalVideoHours == null) {
      setError("Total hours must be a valid number.");
      return;
    }
    const idleDuration = parseOptNumber(form.idleDuration);

    setSaving(true);
    try {
      const db = getDb();
      await addDoc(collection(db, sdCardsCollectionName()), {
        company_name: companyName,
        date_of_recording: form.recordingDate,
        total_video_hours: totalVideoHours,
        idle_duration: idleDuration,
        device_id: form.deviceId.trim() || null,
        operator_name: form.operatorName.trim() || null,
        written_at_utc: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as FirestoreError).message)
          : "Could not save entry.";
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
        className="w-full max-w-xl rounded-t-2xl border border-slate-200 bg-white p-4 shadow-xl sm:rounded-2xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-hours-add-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id="company-hours-add-title" className="text-lg font-semibold text-slate-900">
          Add company hours entry
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          This creates a new document in <code className="rounded bg-slate-100 px-1">SD_CARDS</code>.
        </p>

        <form className="mt-5 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="col-span-full block text-sm font-medium text-slate-700">
              Company name *
              <input
                type="text"
                className={fieldClass}
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder="e.g. PRABANZAN INDUSTRIES"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Date *
              <input
                type="date"
                className={fieldClass}
                value={form.recordingDate}
                onChange={(e) => setForm((f) => ({ ...f, recordingDate: e.target.value }))}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Total hours *
              <input
                type="number"
                step="any"
                min={0}
                className={fieldClass}
                value={form.totalVideoHours}
                onChange={(e) => setForm((f) => ({ ...f, totalVideoHours: e.target.value }))}
                placeholder="e.g. 7.5"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Idle hours
              <input
                type="number"
                step="any"
                min={0}
                className={fieldClass}
                value={form.idleDuration}
                onChange={(e) => setForm((f) => ({ ...f, idleDuration: e.target.value }))}
                placeholder="e.g. 1.2"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Device ID
              <input
                type="text"
                className={fieldClass}
                value={form.deviceId}
                onChange={(e) => setForm((f) => ({ ...f, deviceId: e.target.value }))}
              />
            </label>
            <label className="col-span-full block text-sm font-medium text-slate-700">
              Operator name
              <input
                type="text"
                className={fieldClass}
                value={form.operatorName}
                onChange={(e) => setForm((f) => ({ ...f, operatorName: e.target.value }))}
              />
            </label>
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
