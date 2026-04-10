import type { Timestamp } from "firebase/firestore";

/** Fields stored in Firestore `Daily-Transfer-Data` collection. */
export interface DailyTransferFirestoreDoc {
  date_on_packet?: string | Timestamp | null;
  date_of_transfer?: string | Timestamp | null;
  factory_name?: string | null;
  weight_in_gram?: number | null;
  /** Free text allowed, e.g. "Approx 100", "200 [PORTER]" */
  no_of_sd_cards?: string | number | null;
  /** e.g. "3.4h" */
  average_usable_hours_mtl?: string | number | null;
  average_usable_hours_client?: number | null;
  devices_taken_from_office?: number | null;
  devices_deployed_in_factory?: number | null;
  headset_missing?: number | null;
  missing_sd_cards_out_of_ddif?: number | null;
  empty_sd_cards?: number | null;
  card_operator_name?: string | null;
  /** When this document was first written to Firestore (used as “date of transfer” for reporting). */
  stored_at_utc?: Timestamp | string | null;
}

export interface DailyTransferRow extends DailyTransferFirestoreDoc {
  id: string;
}
