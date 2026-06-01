import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";

const Schema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
});

async function createCustomer(formData: FormData) {
  "use server";

  const raw = {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
  };

  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Input tidak valid");
  }

  await prisma.customer.create({ data: parsed.data });
  redirect("/customers");
}

export default function NewCustomerPage() {
  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="text-xl font-semibold text-slate-900 dark:text-white">
          Tambah Pelanggan
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Isi data pelanggan untuk pembuatan invoice.
        </div>
      </div>

      <form
        action={createCustomer}
        className="max-w-2xl space-y-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-100 shadow backdrop-blur dark:bg-slate-950/40"
      >
        <Field label="Nama" name="name" required />
        <Field label="Telepon (WhatsApp)" name="phone" placeholder="+62..." />
        <Field label="Email" name="email" type="email" />
        <Field label="Alamat" name="address" />

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Simpan
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
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
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
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/60"
      />
    </label>
  );
}

