"use client";

import { useAuth } from "@/contexts/auth-context";
import { ALLOWED_EMAIL_DOMAIN } from "@/lib/auth-domain";

export function LoginScreen() {
  const { signInWithGoogle, authError, clearAuthError, signingIn } = useAuth();

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl backdrop-blur-sm">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-brand-300">
          Mytron Labs
        </p>
        <h1 className="mt-2 text-center text-2xl font-semibold text-white">Dashboard sign-in</h1>
        <p className="mt-3 text-center text-sm leading-relaxed text-slate-400">
          Sign in with your Google workspace account. Only addresses ending with{" "}
          <span className="font-mono text-brand-200">{ALLOWED_EMAIL_DOMAIN}</span> are allowed.
        </p>

        {authError ? (
          <div
            className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-100"
            role="alert"
          >
            <p>{authError}</p>
            <button
              type="button"
              className="mt-2 text-xs font-medium text-amber-200 underline underline-offset-2 hover:text-white"
              onClick={clearAuthError}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <button
          type="button"
          disabled={signingIn}
          onClick={() => void signInWithGoogle()}
          className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {signingIn ? "Signing in…" : "Continue with Google"}
        </button>
      </div>
    </div>
  );
}
