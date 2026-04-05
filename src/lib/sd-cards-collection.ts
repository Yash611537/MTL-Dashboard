/** Firestore collection for SD card session documents. */
export function sdCardsCollectionName(): string {
  return process.env.NEXT_PUBLIC_FIRESTORE_SD_CARDS_COLLECTION ?? "SD_CARDS";
}
