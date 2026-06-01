import { prisma } from "@/lib/prisma";
import { formatIDR } from "@/lib/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [customerCount, invoiceCount, overdueCount, unpaidSum] =
    await Promise.all([
      prisma.customer.count(),
      prisma.invoice.count(),
      prisma.invoice.count({ where: { status: "OVERDUE" } }),
      prisma.invoice
        .aggregate({
          where: { status: { in: ["DRAFT", "SENT", "OVERDUE"] } },
          _sum: { total: true },
        })
        .then((r) => r._sum.total ?? 0),
    ]);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <div className="text-xl font-semibold text-slate-900 dark:text-white">
            Dashboard
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            Ringkasan cepat untuk billing dan notifikasi jatuh tempo.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/customers/new"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Tambah Pelanggan
          </Link>
          <Link
            href="/invoices/new"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Buat Invoice
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Pelanggan" value={customerCount} />
        <StatCard title="Total Invoice" value={invoiceCount} />
        <StatCard title="Jatuh Tempo" value={overdueCount} />
        <StatCard title="Piutang (belum bayar)" value={formatIDR(unpaidSum)} />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <QuickCard
          title="Aksi Cepat"
          items={[
            { href: "/invoices", label: "Kelola Tagihan" },
            { href: "/whatsapp", label: "Cek Status WhatsApp" },
            { href: "/settings", label: "Template Pesan" },
          ]}
        />
        <QuickCard
          title="Catatan"
          items={[
            {
              href: "/settings",
              label:
                "Pastikan DATABASE_URL & kredensial admin sudah di-set di .env",
            },
            {
              href: "/whatsapp",
              label:
                "Scan QR WhatsApp 1x, sesi akan disimpan untuk pengiriman otomatis",
            },
          ]}
        />
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-200 shadow backdrop-blur dark:bg-slate-950/40">
          <div className="text-sm font-semibold">Tampilan</div>
          <div className="mt-1 text-sm text-slate-300">
            Dark / Light mode tersedia. Warna utama memakai gradasi biru tua ↔
            biru muda.
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-200 shadow backdrop-blur dark:bg-slate-950/40">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function QuickCard({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-200 shadow backdrop-blur dark:bg-slate-950/40">
      <div className="text-sm font-semibold text-white">{title}</div>
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <Link
            key={it.href + it.label}
            href={it.href}
            className="block rounded-xl bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
          >
            {it.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
