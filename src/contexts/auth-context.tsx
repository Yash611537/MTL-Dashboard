"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getFirebaseAuth } from "@/lib/firebase";
import { isLoginAllowed, loginUsesEmailAllowlist } from "@/lib/auth-domain";
import { logAllowedLogin, logRejectedLogin } from "@/lib/login-logs";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signingIn: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    try {
      const auth = getFirebaseAuth();
      unsubscribe = onAuthStateChanged(auth, (next) => {
        if (cancelled) return;
        if (next && !isLoginAllowed(next.email)) {
          void signOut(auth);
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(next);
        setLoading(false);
      });
    } catch {
      if (!cancelled) {
        setUser(null);
        setLoading(false);
      }
    }

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setAuthError(null);
    setSigningIn(true);
    try {
      const auth = getFirebaseAuth();
      const result = await signInWithPopup(auth, googleProvider);
      const signedIn = result.user;

      if (!isLoginAllowed(signedIn.email)) {
        await logRejectedLogin(signedIn);
        await signOut(auth);
        setAuthError(
          loginUsesEmailAllowlist()
            ? "This account is not on the approved list. Only selected team members can sign in. This attempt was logged."
            : "Only @mytronlabs.com accounts can use this dashboard. This sign-in attempt was logged."
        );
        return;
      }

      await logAllowedLogin(signedIn);
    } catch (e: unknown) {
      const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        return;
      }
      const message = e instanceof Error ? e.message : "Sign-in failed.";
      setAuthError(message);
    } finally {
      setSigningIn(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setAuthError(null);
    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (e) {
      setAuthError(e instanceof Error ? e.message : "Sign out failed.");
    }
  }, []);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signingIn,
      signInWithGoogle,
      signOutUser,
      authError,
      clearAuthError,
    }),
    [user, loading, signingIn, signInWithGoogle, signOutUser, authError, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
