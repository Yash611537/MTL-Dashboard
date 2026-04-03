"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          <span className="text-sm">Checking sign-in…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <span
            className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
            aria-hidden
          />
          <span className="text-sm">Redirecting…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
