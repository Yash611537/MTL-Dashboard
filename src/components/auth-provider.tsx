"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { formatFirebaseAuthError } from "@/lib/firebase-auth-errors";
import { getFirebaseAuth } from "@/lib/firebase";
import {
  getAuthSafelist,
  getUserAllowlistEmail,
  isEmailAllowed,
} from "@/lib/auth-safelist";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function denyMessage(email: string | null): string {
  const list = getAuthSafelist();
  if (list.size === 0) {
    return "Allowlist is empty in this build. Set NEXT_PUBLIC_AUTH_SAFELIST_EMAILS in your environment, then restart dev or redeploy (Vercel: Project → Settings → Environment Variables).";
  }
  return `Signed in as ${email ?? "unknown"} — that address is not on the allowlist. Add it exactly (comma-separated) to NEXT_PUBLIC_AUTH_SAFELIST_EMAILS and redeploy.`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();

    // Subscribe immediately so redirect / persisted sessions are not missed (do not wait on getRedirectResult first).
    const unsub = onAuthStateChanged(auth, async (u) => {
      const email = u ? getUserAllowlistEmail(u) : null;
      if (u && email && !isEmailAllowed(email)) {
        await signOut(auth);
        setAuthError(denyMessage(email));
        setUser(null);
        setLoading(false);
        return;
      }
      if (u && !email) {
        await signOut(auth);
        setAuthError("Your Google account has no email on file. Use a different account.");
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(u);
      setLoading(false);
    });

    void getRedirectResult(auth)
      .then(async (result) => {
        if (!result?.user) return;
        const email = getUserAllowlistEmail(result.user);
        if (email && !isEmailAllowed(email)) {
          await signOut(auth);
          setAuthError(denyMessage(email));
        }
      })
      .catch((e) => {
        setAuthError(formatFirebaseAuthError(e));
      });

    return () => unsub();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    if (getAuthSafelist().size === 0) {
      setAuthError(
        "Allowlist is not configured (NEXT_PUBLIC_AUTH_SAFELIST_EMAILS is empty in this build). Add it to .env, restart `npm run dev`, or set it in your host’s env and redeploy."
      );
      return;
    }
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithRedirect(auth, provider);
    } catch (e: unknown) {
      setAuthError(formatFirebaseAuthError(e));
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    await signOut(getFirebaseAuth());
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      signInWithGoogle,
      signOutUser,
      clearAuthError,
    }),
    [user, loading, authError, signInWithGoogle, signOutUser, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
