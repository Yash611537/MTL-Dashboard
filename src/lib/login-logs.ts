import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { getDb } from "@/lib/firebase";

function allowedCollection(): string {
  return (
    process.env.NEXT_PUBLIC_FIRESTORE_LOGIN_ALLOWED_LOG ?? "Dashboard_Logins_Allowed"
  );
}

function rejectedCollection(): string {
  return (
    process.env.NEXT_PUBLIC_FIRESTORE_LOGIN_REJECTED_LOG ?? "Dashboard_Logins_Rejected"
  );
}

type BasePayload = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

/** Successful @mytronlabs.com sign-in — audit trail. */
export async function logAllowedLogin(user: User): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, allowedCollection()), {
      ...baseFields(user),
      outcome: "allowed",
      loggedInAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("[login-logs] Failed to write allowed login log", e);
  }
}

/** Google sign-in succeeded but email is not @mytronlabs.com. */
export async function logRejectedLogin(user: User): Promise<void> {
  try {
    const db = getDb();
    await addDoc(collection(db, rejectedCollection()), {
      ...baseFields(user),
      outcome: "denied_domain",
      loggedInAt: serverTimestamp(),
    });
  } catch (e) {
    console.error("[login-logs] Failed to write rejected login log", e);
  }
}

function baseFields(user: User): BasePayload {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
  };
}
