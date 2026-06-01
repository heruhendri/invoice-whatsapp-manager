"use client";

import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4">
      <div>
        <div className="text-lg font-semibold text-slate-900 dark:text-white">
          Dashboard
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300">
          Manajemen pelanggan, invoice, dan notifikasi jatuh tempo
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}

