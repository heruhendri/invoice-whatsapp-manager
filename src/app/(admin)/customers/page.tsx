import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">
            Pelanggan
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Data pelanggan untuk invoice dan notifikasi WhatsApp.
          </div>
        </div>

        <Link
          href="/customers/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          Tambah Pelanggan
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow backdrop-blur dark:bg-slate-950/40">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3">Nama</th>
              <th className="px-5 py-3">Telepon</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Alamat</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-white/10">
                <td className="px-5 py-3 font-medium text-white">{c.name}</td>
                <td className="px-5 py-3 text-slate-200">{c.phone ?? "-"}</td>
                <td className="px-5 py-3 text-slate-200">{c.email ?? "-"}</td>
                <td className="px-5 py-3 text-slate-200">
                  {c.address ?? "-"}
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-slate-300" colSpan={4}>
                  Belum ada pelanggan. Klik &quot;Tambah Pelanggan&quot; untuk
                  mulai.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
