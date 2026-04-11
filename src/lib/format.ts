import { format } from "date-fns";
import type { Timestamp } from "firebase/firestore";

export function formatMaybeDate(
  v: Timestamp | string | null | undefined
): string {
  if (v == null) return "—";
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? v : format(d, "yyyy-MM-dd");
  }
  if (typeof v === "object" && "toDate" in v && typeof v.toDate === "function") {
    return format(v.toDate(), "yyyy-MM-dd");
  }
  return "—";
}

/** ISO datetimes, Timestamps, epoch ms, or plain `HH:MM` / `H:MM:SS` → `HH:MM` (24h). */
export function formatMaybeTimeHHMM(v: unknown): string {
  if (v == null || v === "") return "—";
  if (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof (v as Timestamp).toDate === "function"
  ) {
    return format((v as Timestamp).toDate(), "HH:mm");
  }
  if (typeof v === "number" && !Number.isNaN(v)) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? "—" : format(d, "HH:mm");
  }
  if (typeof v === "string") {
    const s = v.trim();
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return format(d, "HH:mm");
    const simple = /^(\d{1,2}):(\d{2})(?::\d+(?:\.\d+)?)?$/.exec(s);
    if (simple) {
      const h = simple[1].padStart(2, "0");
      return `${h}:${simple[2]}`;
    }
    return s;
  }
  return "—";
}

/** Display idle like 1:24 as 1.24 (after-colon part becomes the decimal tail; single-digit minutes padded). */
export function formatIdleDisplay(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "number" && !Number.isNaN(v)) {
    return v.toLocaleString(undefined, { maximumFractionDigits: 3 });
  }
  const s = String(v).trim();
  const m = /^(\d+)\s*:\s*(\d+)$/.exec(s);
  if (m) {
    const whole = m[1];
    const after = m[2];
    const frac = after.length === 1 ? after.padStart(2, "0") : after;
    return `${whole}.${frac}`;
  }
  const n = toNumber(v);
  if (n !== undefined) return n.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return s;
}

/** Numeric value for idle (for math), aligned with formatIdleDisplay. */
export function idleDurationAsNumber(v: unknown): number | undefined {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const s = v.trim();
    const m = /^(\d+)\s*:\s*(\d+)$/.exec(s);
    if (m) {
      const after = m[2];
      const frac = after.length === 1 ? after.padStart(2, "0") : after;
      const n = parseFloat(`${m[1]}.${frac}`);
      return Number.isNaN(n) ? undefined : n;
    }
    const n = parseFloat(s);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

export function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isNaN(n) ? undefined : n;
  }
  return undefined;
}

/** Parse sheet-style DD/MM/YYYY, Firestore Timestamps, and ISO strings to YYYY-MM-DD (for inputs). */
export function normalizeDateToYyyyMmDd(v: unknown): string {
  if (v == null || v === "") return "";
  if (
    typeof v === "object" &&
    v !== null &&
    "toDate" in v &&
    typeof (v as Timestamp).toDate === "function"
  ) {
    return format((v as Timestamp).toDate(), "yyyy-MM-dd");
  }
  const s = String(v).trim();
  const slash = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (slash) {
    const dd = slash[1].padStart(2, "0");
    const mm = slash[2].padStart(2, "0");
    const yyyy = slash[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return format(d, "yyyy-MM-dd");
  return "";
}

/** Table cell: date only as YYYY-MM-DD. */
export function formatDailyTransferDateCell(v: unknown): string {
  const ymd = normalizeDateToYyyyMmDd(v);
  return ymd || "—";
}

export function formatEmptyCard(v: unknown): string {
  if (v === true || v === "true" || v === 1 || v === "1") return "Yes";
  if (v === false || v === "false" || v === 0 || v === "0") return "No";
  if (v == null || v === "") return "—";
  return String(v);
}
