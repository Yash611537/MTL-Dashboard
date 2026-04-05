"use client";

import { AppShell } from "@/components/app-shell";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/contexts/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen min-h-[100dvh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <span
            className="h-10 w-10 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          <p className="text-sm text-slate-600">Checking sign-in…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <AppShell>{children}</AppShell>;
}
