export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
      <div className="flex flex-col gap-1 px-4 py-3 sm:gap-0.5 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl">{title}</h1>
          <span className="shrink-0 text-xs font-medium text-brand-600 sm:text-sm">Mytron Labs</span>
        </div>
        {subtitle ? (
          <p className="text-sm leading-snug text-slate-500 sm:leading-normal">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
