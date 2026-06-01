import { prisma } from "@/lib/prisma";
import { getSettings } from "@/lib/settings";
import { redirect } from "next/navigation";
import { z } from "zod";

export const dynamic = "force-dynamic";

const Schema = z.object({
  invoiceNo: z.string().min(1),
  issueDate: z.string().min(1),
  dueDate: z.string().min(1),
  customerId: z.string().optional(),
  customerName: z.string().min(1),
  customerAddress: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().optional(),
  itemsText: z.string().min(1),
  discount: z.coerce.number().int().min(0).default(0),
  tax: z.coerce.number().int().min(0).default(0),
});

async function createInvoice(formData: FormData) {
  "use server";

  const raw = {
    invoiceNo: String(formData.get("invoiceNo") ?? "").trim(),
    issueDate: String(formData.get("issueDate") ?? "").trim(),
    dueDate: String(formData.get("dueDate") ?? "").trim(),
    customerId: String(formData.get("customerId") ?? "").trim() || undefined,
    customerName: String(formData.get("customerName") ?? "").trim(),
    customerAddress: String(formData.get("customerAddress") ?? "").trim() || undefined,
    customerPhone: String(formData.get("customerPhone") ?? "").trim() || undefined,
    customerEmail: String(formData.get("customerEmail") ?? "").trim() || undefined,
    itemsText: String(formData.get("itemsText") ?? "").trim(),
    discount: formData.get("discount") ?? "0",
    tax: formData.get("tax") ?? "0",
  };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) throw new Error("Input tidak valid");

  const items = parseItems(parsed.data.itemsText);
  if (items.length === 0) throw new Error("Minimal 1 item");

  const subtotal = items.reduce((a, b) => a + b.lineTotal, 0);
  const total = Math.max(0, subtotal - parsed.data.discount + parsed.data.tax);

  const settings = await getSettings();

  await prisma.invoice.create({
    data: {
      invoiceNo: parsed.data.invoiceNo,
      issueDate: new Date(parsed.data.issueDate),
      dueDate: new Date(parsed.data.dueDate),
      status: "DRAFT",
      customerId: parsed.data.customerId ? Number(parsed.data.customerId) : null,
      customerName: parsed.data.customerName,
      customerAddress: parsed.data.customerAddress ?? null,
      customerPhone: parsed.data.customerPhone ?? null,
      customerEmail: parsed.data.customerEmail ?? null,
      subtotal,
      discount: parsed.data.discount,
      tax: parsed.data.tax,
      total,
      paymentBankName: settings.paymentBankName,
      paymentAccountNumber: settings.paymentAccountNumber,
      paymentAccountName: settings.paymentAccountName,
      items: { create: items },
    },
  });

  redirect("/invoices");
}

export default async function NewInvoicePage() {
  const customers = await prisma.customer.findMany({
    orderBy: { name: "asc" },
  });

  const today = new Date();
  const issueDefault = today.toISOString().slice(0, 10);
  const dueDefault = new Date(today.getTime() + 5 * 24 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="text-xl font-semibold text-slate-900 dark:text-white">
          Buat Invoice
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Format item: satu baris per item → <code>deskripsi|qty|harga</code>
        </div>
      </div>

      <form
        action={createInvoice}
        className="grid max-w-4xl gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-100 shadow backdrop-blur dark:bg-slate-950/40"
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="No Invoice" name="invoiceNo" required placeholder="1504" />
          <Field label="Tanggal" name="issueDate" type="date" required defaultValue={issueDefault} />
          <Field label="Jatuh Tempo" name="dueDate" type="date" required defaultValue={dueDefault} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pilih pelanggan (opsional)
            </div>
            <select
              name="customerId"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none focus:border-blue-500/60"
            >
              <option value="">-- Manual --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-slate-400">
              Jika dipilih, tetap isi field manual di bawah bila ingin snapshot berbeda.
            </div>
          </label>
          <div className="grid gap-4">
            <Field label="Nama Pelanggan" name="customerName" required />
            <Field label="Telepon (WhatsApp)" name="customerPhone" placeholder="+62..." />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email" name="customerEmail" type="email" />
          <Field label="Alamat" name="customerAddress" />
        </div>

        <label className="block">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Item (deskripsi|qty|harga)
          </div>
          <textarea
            name="itemsText"
            required
            rows={5}
            defaultValue={"VPN OLT,VPN WINBOX,VPN MIKHMON|1|50000\nMONITOR,SUPPORT,MAINTENECE(Under100)|41|5000"}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/60"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Diskon" name="discount" type="number" defaultValue="0" />
          <Field label="Pajak" name="tax" type="number" defaultValue="0" />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Simpan Invoice
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/60"
      />
    </label>
  );
}

function parseItems(itemsText: string) {
  const lines = itemsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    const [descriptionRaw, qtyRaw, priceRaw] = line.split("|").map((s) => s.trim());
    const qty = Number(qtyRaw);
    const unitPrice = Number(priceRaw);
    if (!descriptionRaw || !Number.isFinite(qty) || !Number.isFinite(unitPrice)) {
      throw new Error(`Format item salah: ${line}`);
    }
    return {
      description: descriptionRaw,
      qty,
      unitPrice,
      lineTotal: qty * unitPrice,
    };
  });
}
