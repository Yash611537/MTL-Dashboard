"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useAuth } from "@/contexts/auth-context";

const nav = [
  { href: "/", label: "Home" },
  { href: "/sd-cards", label: "SD-Cards" },
  { href: "/company-hours", label: "Company Hours" },
  { href: "/inventory-management", label: "Inventory Management" },
];

type Props = {
  id?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function Sidebar({ id, mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();

  return (
    <aside
      id={id}
      className={clsx(
        "fixed inset-y-0 left-0 z-50 flex w-[min(18rem,88vw)] shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 transition-transform duration-200 ease-out md:relative md:z-0 md:w-56 md:max-w-none md:translate-x-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-slate-800 px-4 py-4 md:py-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-widest text-brand-300">Mytron Labs</p>
          <p className="mt-1 text-sm font-semibold text-white">Dashboard</p>
        </div>
        <button
          type="button"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Close menu"
          onClick={onMobileClose}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:py-2",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              onClick={() => onMobileClose()}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-slate-800 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="truncate text-xs text-slate-500">Signed in</p>
        <p className="mt-0.5 truncate text-sm font-medium text-slate-200" title={user?.email ?? undefined}>
          {user?.email ?? "—"}
        </p>
        <button
          type="button"
          className="mt-3 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 hover:text-white"
          onClick={() => {
            void signOutUser();
            onMobileClose();
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
