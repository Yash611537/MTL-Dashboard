import { Header } from "@/components/header";

export default function HomePage() {
  return (
    <>
      <Header
        title="Home"
        subtitle="Welcome to the Mytron Labs dashboard. Use the sidebar to open SD-Cards."
      />
      <main className="flex flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        <div className="max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Getting started</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Sign in with Google using your <strong className="text-slate-800">@mytronlabs.com</strong> account. To allow
            only a few people, set <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
              NEXT_PUBLIC_ALLOWED_LOGIN_EMAILS
            </code>{" "}
            in <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env.local</code> (comma-separated emails).
            Configure Firebase, enable Google Authentication, and set your Firestore collection names if needed. Then open{" "}
            <strong className="text-slate-800">SD-Cards</strong>,{" "}
            <strong className="text-slate-800">Company Hours</strong>, or{" "}
            <strong className="text-slate-800">PREVIOUS JUNK</strong> from the sidebar.
          </p>
        </div>
      </main>
    </>
  );
}
