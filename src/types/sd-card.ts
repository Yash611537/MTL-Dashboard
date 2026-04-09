import type { Timestamp } from "firebase/firestore";

/** Document shape in Firestore (snake_case fields). */
export interface SdCardFirestoreDoc {
  bytes_copied?: number;
  company_name?: string;
  company_type?: string;
  date_of_cop_paste?: Timestamp | string | null;
  date_of_recording?: Timestamp | string | null;
  device_id?: string;
  empty_card?: boolean | string | number | null;
  files_copied?: number;
  idle_duration?: number;
  operator_name?: string;
  /** When set, overrides PRABANZAN-style ≤7h / &gt;7h inference for company-hours aggregation. */
  session_segment?: "all" | "le7" | "gt7" | null;
  session_label?: string;
  source_mount_point?: string;
  total_sd_card_size_bytes?: number;
  /** Defaults to 1 when aggregating company hours if omitted. */
  worker_count?: number | null;
  total_video_hours?: number;
  transfer_success?: boolean | string;
  validation_passed?: boolean | string;
  written_at_utc?: Timestamp | string | null;
}

export interface SdCardRow extends SdCardFirestoreDoc {
  id: string;
}
