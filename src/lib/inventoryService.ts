import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";

export type PackageType = "Dispatch" | "Return";

export interface InventoryEntry {
  id?: string;
  packageType: PackageType;
  /** Unique id generated for dispatch entries. */
  dispatchId?: string;
  /** For return entries, points to the original dispatch id. */
  linkedDispatchId?: string;
  date: string;
  factoryName: string;
  warehouseCity?: string;
  warehouseOperator: string;
  factoryOperator: string;
  inventory: {
    cards: {
      weightGrams: number;
      totalCards: number;
      filledCards: number;
      cardsDeployed?: number;
    };
    devices: {
      count: number;
      type: string;
      devicesDeployed?: number;
    };
    chargers: {
      count: number;
      type: string;
      ports: number;
    };
    others: string;
  };
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type InventoryEntryInput = Omit<InventoryEntry, "id" | "createdAt" | "updatedAt">;

const collectionName = "inventory_management";

export async function getEntries(): Promise<InventoryEntry[]> {
  const db = getDb();
  const ref = collection(db, collectionName);
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryEntry, "id">) }));
}

export async function addEntry(data: InventoryEntryInput): Promise<void> {
  const db = getDb();
  const ref = collection(db, collectionName);
  await addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateEntry(id: string, data: InventoryEntryInput): Promise<void> {
  const db = getDb();
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = getDb();
  const ref = doc(db, collectionName, id);
  await deleteDoc(ref);
}
