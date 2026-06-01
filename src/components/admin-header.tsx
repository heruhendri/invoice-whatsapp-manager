"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";

function titleFromPath(pathname: string) {
  if (pathname.startsWith("/customers")) return "Pelanggan";
  if (pathname.startsWith("/invoices")) return "Tagihan / Invoice";
  if (pathname.startsWith("/whatsapp")) return "Status WhatsApp";
  if (pathname.startsWith("/settings")) return "Pengaturan";
  return "Dashboard";
}

export function AdminHeader() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);

  return (
    <div className="sticky top-0 z-10 border-b border-white/10 bg-white/40 px-6 py-4 backdrop-blur dark:bg-slate-950/20">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold text-slate-900 dark:text-white">
            {title}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Dark / Light mode • Gradasi biru tua ↔ biru muda
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
}

