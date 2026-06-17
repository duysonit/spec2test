'use client';

import {
  SignOut,
  GearSix,
  X,
  ArrowLeft,
  CaretUpDown,
} from '@phosphor-icons/react';

type NavItem = {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick: () => void;
};

/**
 * Vercel-style application shell: fixed left sidebar + slim top bar.
 */
export function AppShell({
  user,
  nav,
  onLogout,
  onHome,
  topbar,
  children,
}: {
  user: any;
  nav: NavItem[];
  onLogout: () => void;
  onHome: () => void;
  topbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  const initial = (user?.full_name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-[100dvh] bg-[rgb(var(--background))]">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-800 bg-[rgb(var(--surface))] lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center border-b border-slate-800 px-5">
          <button
            type="button"
            onClick={onHome}
            aria-label="Go to dashboard"
            className="rounded transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-[rgb(var(--surface))]"
          >
            <img
              src="/logo-hsc.png?v=2"
              alt="HSC"
              className="h-7 w-auto [filter:brightness(0)_invert(1)]"
            />
          </button>
        </div>

        {/* Account row */}
        <div className="flex items-center gap-2.5 border-b border-slate-800 px-3 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-500 text-sm font-semibold text-white">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-100">
              {user?.full_name || user?.email || 'Account'}
            </p>
            <p className="truncate text-xs text-slate-500">{user?.is_admin ? 'Admin' : 'QC Engineer'}</p>
          </div>
          <CaretUpDown size={16} className="text-slate-500" />
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={`flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors ${
                item.active
                  ? 'bg-[rgba(51,119,255,0.12)] text-accent-300'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 px-3 py-3">
          <button onClick={onLogout} className="btn-ghost w-full justify-start">
            <SignOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile top brand bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-800 bg-[rgb(var(--background))]/90 px-4 backdrop-blur lg:hidden">
        <button type="button" onClick={onHome} aria-label="Go to dashboard">
          <img src="/logo-hsc.png?v=2" alt="HSC" className="h-6 w-auto [filter:brightness(0)_invert(1)]" />
        </button>
        <button onClick={onLogout} className="btn-ghost">
          <SignOut size={18} />
        </button>
      </div>

      {/* Content area */}
      <div className="lg:pl-60">
        {topbar && (
          <div className="sticky top-0 z-20 hidden h-16 items-center border-b border-slate-800 bg-[rgb(var(--background))]/80 px-6 backdrop-blur lg:flex">
            {topbar}
          </div>
        )}
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}


export function AppHeader({
  user,
  onLogout,
  onAdmin,
  onHome,
  onBack,
  backLabel = 'Back',
}: {
  user: any;
  onLogout: () => void;
  onAdmin?: () => void;
  onHome?: () => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[rgb(var(--background))]/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onHome}
            aria-label="Go to dashboard"
            className="rounded transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background))]"
          >
            <img
              src="/logo-hsc.png?v=2"
              alt="HSC"
              className="h-7 w-auto [filter:brightness(0)_invert(1)]"
            />
          </button>
          {onBack && (
            <>
              <span className="h-5 w-px bg-slate-800" aria-hidden />
              <button type="button" onClick={onBack} className="btn-ghost">
                <ArrowLeft size={16} weight="bold" />
                <span className="hidden sm:inline">{backLabel}</span>
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user?.is_admin && onAdmin && (
            <button onClick={onAdmin} className="btn-ghost">
              <GearSix size={18} />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
          <span className="hidden px-2 text-sm text-slate-400 sm:inline">{user?.email}</span>
          <button onClick={onLogout} className="btn-ghost">
            <SignOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[rgb(var(--background))]">
      <div className="flex items-center gap-3 text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-accent-400" />
        <span className="text-sm font-medium">Loading...</span>
      </div>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-card border border-dashed border-slate-700 bg-[rgb(var(--surface))] px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-slate-100">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-400">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Modal({
  children,
  onClose,
  title,
  size = 'md',
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  size?: 'md' | 'lg' | 'xl';
}) {
  const width =
    size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-3xl' : 'max-w-2xl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className={`card max-h-[90vh] w-full ${width} overflow-hidden`}>
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <h2 className="text-lg font-semibold tracking-tight text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <X size={18} weight="bold" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-65px)] overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
