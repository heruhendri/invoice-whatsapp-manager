import type { ReactNode } from "react";
import { Sidebar } from "@/components/sidebar";
import { AdminHeader } from "@/components/admin-header";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">
        <div className="min-h-screen bg-white/50 dark:bg-slate-950/10">
          <AdminHeader />
          {children}
        </div>
      </main>
    </div>
  );
}
