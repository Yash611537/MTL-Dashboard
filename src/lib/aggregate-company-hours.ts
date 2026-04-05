import { format, parseISO } from "date-fns";
import type { SdCardRow } from "@/types/sd-card";
import type { CompanyHoursRow, CompanyHoursSegment } from "@/types/company-hours";
import { idleDurationAsNumber, normalizeDateToYyyyMmDd, toNumber } from "@/lib/format";

function activeHoursForRow(row: SdCardRow): number {
  const tv = toNumber(row.total_video_hours) ?? 0;
  const idle = idleDurationAsNumber(row.idle_duration) ?? 0;
  return tv - idle;
}

function calendarDayKey(row: SdCardRow): string | null {
  const ymd =
    normalizeDateToYyyyMmDd(row.date_of_recording) ||
    normalizeDateToYyyyMmDd(row.date_of_cop_paste) ||
    normalizeDateToYyyyMmDd(row.written_at_utc);
  return ymd || null;
}

function companyLabel(name: string | undefined): string {
  const t = (name ?? "").trim();
  return t || "—";
}

const PRABANZAN_MARK = "PRABANZAN";

/** Split / halve rule applies only when the stored company name contains PRABANZAN (any case). */
export function isPrabanzanCompanyName(name: string | undefined): boolean {
  const t = (name ?? "").trim().toUpperCase();
  return t.includes(PRABANZAN_MARK);
}

function segmentForRow(
  companyNameRaw: string | undefined,
  totalVideoHours: number
): CompanyHoursSegment {
  if (!isPrabanzanCompanyName(companyNameRaw)) return "all";
  return totalVideoHours > 7 ? "gt7" : "le7";
}

export function companyHoursSegmentSortKey(s: CompanyHoursSegment): number {
  if (s === "all") return 0;
  if (s === "le7") return 1;
  return 2;
}

export function hourSegmentLabel(s: CompanyHoursSegment): string {
  if (s === "gt7") return ">7 h / session";
  if (s === "le7") return "≤7 h / session";
  return "—";
}

/**
 * Groups SD card sessions by company + calendar day.
 * For companies whose name contains "PRABANZAN" (case-insensitive), sessions with
 * total_video_hours &gt; 7 are aggregated separately and that row's active hours
 * per worker is halved. All other companies get one row per day.
 */
export function aggregateCompanyHoursByDay(rows: SdCardRow[]): CompanyHoursRow[] {
  const map = new Map<
    string,
    {
      companyName: string;
      dateKey: string;
      segment: CompanyHoursSegment;
      workers: number;
      video: number;
      active: number;
    }
  >();

  for (const row of rows) {
    const dateKey = calendarDayKey(row);
    if (!dateKey) continue;

    const companyName = companyLabel(row.company_name);
    const tv = toNumber(row.total_video_hours) ?? 0;
    const segment = segmentForRow(row.company_name, tv);
    const key = `${companyName}\0${dateKey}\0${segment}`;
    const active = activeHoursForRow(row);

    const cur = map.get(key);
    if (cur) {
      cur.workers += 1;
      cur.video += tv;
      cur.active += active;
    } else {
      map.set(key, {
        companyName,
        dateKey,
        segment,
        workers: 1,
        video: tv,
        active,
      });
    }
  }

  const out: CompanyHoursRow[] = [];
  for (const v of map.values()) {
    const w = v.workers;
    const basePerWorker = w > 0 ? v.active / w : 0;
    const activeHoursPerWorker = v.segment === "gt7" ? basePerWorker / 2 : basePerWorker;
    const rowKey = `${v.companyName}\0${v.dateKey}\0${v.segment}`;
    out.push({
      rowKey,
      companyName: v.companyName,
      dateKey: v.dateKey,
      hourSegment: v.segment,
      totalWorkers: w,
      totalVideoHours: v.video,
      totalActiveHours: v.active,
      activeHoursPerWorker,
    });
  }

  out.sort((a, b) => {
    const dc = b.dateKey.localeCompare(a.dateKey);
    if (dc !== 0) return dc;
    const cc = a.companyName.localeCompare(b.companyName, undefined, { sensitivity: "base" });
    if (cc !== 0) return cc;
    return companyHoursSegmentSortKey(a.hourSegment) - companyHoursSegmentSortKey(b.hourSegment);
  });

  return out;
}

export function formatCompanyHoursDateCell(dateKey: string): string {
  try {
    return format(parseISO(dateKey), "MMM d, yyyy");
  } catch {
    return dateKey;
  }
}
