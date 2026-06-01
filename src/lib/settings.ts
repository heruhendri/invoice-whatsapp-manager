import { prisma } from "./prisma";

export type AppSettings = {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  paymentBankName: string;
  paymentAccountNumber: string;
  paymentAccountName: string;
  whatsappMessageTemplate: string;
};

const DEFAULTS: AppSettings = {
  companyName: "HENDRI",
  companyAddress: "Alamat Perusahaan",
  companyPhone: "+62xxxxxxxxxxx",
  companyEmail: "email@contoh.com",
  paymentBankName: "BCA",
  paymentAccountNumber: "000-000-0000",
  paymentAccountName: "NAMA REKENING",
  whatsappMessageTemplate:
    "Halo {{nama}}, ini invoice {{invoiceNo}} total {{total}}. Jatuh tempo: {{dueDate}}. Terima kasih.",
};

export async function getSettings(): Promise<AppSettings> {
  const keys = Object.keys(DEFAULTS) as (keyof AppSettings)[];
  const rows = await prisma.setting.findMany({
    where: { key: { in: keys as unknown as string[] } },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const out: any = {};
  for (const k of keys) out[k] = map.get(k) ?? DEFAULTS[k];
  return out as AppSettings;
}

export async function setSettings(patch: Partial<AppSettings>) {
  const entries = Object.entries(patch) as [keyof AppSettings, string][];
  await prisma.$transaction(
    entries.map(([key, value]) =>
      prisma.setting.upsert({
        where: { key: key as string },
        create: { key: key as string, value: String(value) },
        update: { value: String(value) },
      }),
    ),
  );
}

