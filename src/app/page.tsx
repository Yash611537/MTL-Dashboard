"use client";

import { Header } from "@/components/header";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/components/auth-provider";

export default function HomePage() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <>
      <Header
        title="Home"
        subtitle="Welcome to the Mytron Labs dashboard. Use the sidebar to open SD-Cards or Daily Transfers."
      />
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Getting started</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Firestore collections are configured via{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env</code>. Open{" "}
            <strong className="text-slate-800">SD-Cards</strong> or{" "}
            <strong className="text-slate-800">Daily Transfers</strong> from the sidebar.
          </p>
        </div>
      </main>
    </>
  );
}
