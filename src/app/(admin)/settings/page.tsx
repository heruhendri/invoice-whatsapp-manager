import { getSettings, setSettings } from "@/lib/settings";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function saveSettings(formData: FormData) {
  "use server";
  await setSettings({
    companyName: String(formData.get("companyName") ?? ""),
    companyAddress: String(formData.get("companyAddress") ?? ""),
    companyPhone: String(formData.get("companyPhone") ?? ""),
    companyEmail: String(formData.get("companyEmail") ?? ""),
    paymentBankName: String(formData.get("paymentBankName") ?? ""),
    paymentAccountNumber: String(formData.get("paymentAccountNumber") ?? ""),
    paymentAccountName: String(formData.get("paymentAccountName") ?? ""),
    whatsappMessageTemplate: String(formData.get("whatsappMessageTemplate") ?? ""),
  });
  redirect("/settings");
}

export default async function SettingsPage() {
  const s = await getSettings();

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="text-xl font-semibold text-slate-900 dark:text-white">
          Pengaturan
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Info perusahaan untuk invoice & template pesan WhatsApp.
        </div>
      </div>

      <form
        action={saveSettings}
        className="grid max-w-4xl gap-4 rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-100 shadow backdrop-blur dark:bg-slate-950/40"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nama Perusahaan" name="companyName" defaultValue={s.companyName} />
          <Field label="Telepon Perusahaan" name="companyPhone" defaultValue={s.companyPhone} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Email Perusahaan" name="companyEmail" defaultValue={s.companyEmail} />
          <Field label="Alamat Perusahaan" name="companyAddress" defaultValue={s.companyAddress} />
        </div>

        <div className="mt-2 text-sm font-semibold text-white">Pembayaran</div>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Bank" name="paymentBankName" defaultValue={s.paymentBankName} />
          <Field
            label="No. Rek"
            name="paymentAccountNumber"
            defaultValue={s.paymentAccountNumber}
          />
          <Field
            label="Atas Nama"
            name="paymentAccountName"
            defaultValue={s.paymentAccountName}
          />
        </div>

        <div className="mt-2 text-sm font-semibold text-white">
          Template WhatsApp
        </div>
        <label className="block">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Pesan
          </div>
          <textarea
            name="whatsappMessageTemplate"
            rows={5}
            defaultValue={s.whatsappMessageTemplate}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/60"
          />
          <div className="mt-1 text-xs text-slate-400">
            Variabel: <code>{"{{nama}}"}</code>, <code>{"{{invoiceNo}}"}</code>,{" "}
            <code>{"{{total}}"}</code>, <code>{"{{dueDate}}"}</code>
          </div>
        </label>

        <div className="pt-2">
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-500"
          >
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/60"
      />
    </label>
  );
}
