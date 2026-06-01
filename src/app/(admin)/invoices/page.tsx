import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">
            Tagihan / Invoice
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Buat invoice, unduh PDF, dan kirim WhatsApp.
          </div>
        </div>

        <Link
          href="/invoices/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
        >
          Buat Invoice
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60 shadow backdrop-blur dark:bg-slate-950/40">
        <table className="w-full text-left text-sm text-slate-200">
          <thead className="bg-white/5 text-xs uppercase tracking-wider text-slate-400">
            <tr>
              <th className="px-5 py-3">No</th>
              <th className="px-5 py-3">Pelanggan</th>
              <th className="px-5 py-3">Jatuh Tempo</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-white/10">
                <td className="px-5 py-3 font-medium text-white">
                  {inv.invoiceNo}
                </td>
                <td className="px-5 py-3 text-slate-200">{inv.customerName}</td>
                <td className="px-5 py-3 text-slate-200">
                  {inv.dueDate.toISOString().slice(0, 10)}
                </td>
                <td className="px-5 py-3 text-slate-200">
                  {formatIDR(inv.total)}
                </td>
                <td className="px-5 py-3">
                  <StatusBadge status={inv.status} />
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    <a
                      className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/10"
                      href={`/api/invoices/${inv.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      PDF
                    </a>
                    <form action={`/api/invoices/${inv.id}/send-whatsapp`} method="post">
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/30"
                      >
                        Kirim WA
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-slate-300" colSpan={6}>
                  Belum ada invoice.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "PAID"
      ? "bg-emerald-500/20 text-emerald-200"
      : status === "OVERDUE"
        ? "bg-rose-500/20 text-rose-200"
        : status === "SENT"
          ? "bg-sky-500/20 text-sky-200"
          : "bg-white/10 text-slate-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}
