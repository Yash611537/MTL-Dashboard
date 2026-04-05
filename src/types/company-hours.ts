/** `all` = single row (default); `le7` / `gt7` = PRABANZAN / PRABANJAN split buckets. */
export type CompanyHoursSegment = "all" | "le7" | "gt7";

/** One row per company per day; PRABANZAN / PRABANJAN may split into ≤7h and &gt;7h rows. */
export interface CompanyHoursRow {
  /** Stable id for table rows */
  rowKey: string;
  companyName: string;
  /** YYYY-MM-DD for sorting */
  dateKey: string;
  hourSegment: CompanyHoursSegment;
  totalWorkers: number;
  totalVideoHours: number;
  totalActiveHours: number;
  activeHoursPerWorker: number;
}
