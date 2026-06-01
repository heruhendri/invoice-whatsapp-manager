"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  MessageSquareText,
  Settings,
} from "lucide-react";
import { clsx } from "clsx";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

function NavLink({ href, label, icon }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
        active
          ? "bg-blue-600/15 text-blue-200 ring-1 ring-blue-400/20"
          : "text-slate-300 hover:bg-white/5 hover:text-white",
      )}
    >
      <span className="text-slate-300">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export function Sidebar() {
  return (
    <aside className="h-full w-[270px] shrink-0 border-r border-white/10 bg-slate-950/40 backdrop-blur">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 text-white shadow">
            <span className="text-sm font-bold">IM</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              INVOICE MANAGER
            </div>
            <div className="text-xs text-slate-400">Admin Panel</div>
          </div>
        </div>
      </div>

      <div className="px-3 pb-6">
        <div className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-500">
          UTAMA
        </div>
        <nav className="space-y-1">
          <NavLink
            href="/dashboard"
            label="Dashboard"
            icon={<LayoutDashboard size={16} />}
          />
          <NavLink
            href="/customers"
            label="Pelanggan"
            icon={<Users size={16} />}
          />
          <NavLink
            href="/invoices"
            label="Tagihan / Invoice"
            icon={<Receipt size={16} />}
          />
        </nav>

        <div className="mt-6 mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-500">
          NOTIFIKASI
        </div>
        <nav className="space-y-1">
          <NavLink
            href="/whatsapp"
            label="Status WhatsApp"
            icon={<MessageSquareText size={16} />}
          />
          <NavLink
            href="/settings"
            label="Pengaturan"
            icon={<Settings size={16} />}
          />
        </nav>
      </div>
    </aside>
  );
}

