"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./auth-provider";
import { Sidebar } from "./sidebar";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function AuthLoading() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3 text-slate-500">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
          aria-hidden
        />
        <span className="text-sm">Loading…</span>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <div className="min-h-[100dvh] bg-slate-50">{children}</div>;
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-50">
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-950 px-4 shadow-sm md:hidden">
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-100 transition hover:bg-slate-800"
          aria-expanded={mobileNavOpen}
          aria-controls="dashboard-sidebar"
          aria-label={mobileNavOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? (
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <MenuIcon className="h-6 w-6" />
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-widest text-brand-300">
            Mytron Labs
          </p>
          <p className="truncate text-sm font-semibold text-white">Dashboard</p>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 md:min-h-screen">
        <Sidebar
          id="dashboard-sidebar"
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        {mobileNavOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-[1px] md:hidden"
            aria-label="Close menu"
            onClick={() => setMobileNavOpen(false)}
          />
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}
