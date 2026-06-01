import "dotenv/config";

import cron from "node-cron";
import { prisma } from "../src/lib/prisma";
import { getSettings } from "../src/lib/settings";
import { formatIDR } from "../src/lib/format";
import { generateInvoicePdfBuffer } from "../src/lib/invoice-pdf";
import { getWaStatus, sendWhatsAppMessage } from "../src/lib/whatsapp";

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}

async function processDueInvoices() {
  const status = await getWaStatus();
  if (!status.connected) {
    console.log("[worker] WhatsApp belum terhubung. Skip pengiriman.");
    return;
  }

  const settings = await getSettings();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const invoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["DRAFT", "SENT", "OVERDUE"] },
      dueDate: { lte: now },
      customerPhone: { not: null },
      OR: [{ lastSentAt: null }, { lastSentAt: { lt: oneHourAgo } }],
    },
    orderBy: { dueDate: "asc" },
    take: 50,
  });

  if (invoices.length === 0) {
    console.log("[worker] Tidak ada invoice jatuh tempo untuk dikirim.");
    return;
  }

  console.log(`[worker] Mengirim ${invoices.length} invoice...`);

  for (const inv of invoices) {
    const phone = inv.customerPhone?.trim();
    if (!phone) continue;

    const text = renderTemplate(settings.whatsappMessageTemplate, {
      nama: inv.customerName,
      invoiceNo: inv.invoiceNo,
      total: formatIDR(inv.total),
      dueDate: inv.dueDate.toISOString().slice(0, 10),
    });

    try {
      const pdf = await generateInvoicePdfBuffer(inv.id);
      await sendWhatsAppMessage(phone, text, pdf, `invoice-${inv.invoiceNo}.pdf`);

      await prisma.$transaction([
        prisma.invoice.update({
          where: { id: inv.id },
          data: {
            status: inv.status === "PAID" ? "PAID" : "OVERDUE",
            sentAt: inv.sentAt ?? new Date(),
            lastSentAt: new Date(),
          },
        }),
        prisma.invoiceDeliveryLog.create({
          data: {
            invoiceId: inv.id,
            channel: "WHATSAPP",
            status: "SUCCESS",
            detail: "Worker hourly",
          },
        }),
      ]);

      console.log(`[worker] OK: ${inv.invoiceNo} -> ${phone}`);
    } catch (e: any) {
      await prisma.invoiceDeliveryLog.create({
        data: {
          invoiceId: inv.id,
          channel: "WHATSAPP",
          status: "FAILED",
          detail: String(e?.message ?? e),
        },
      });
      console.log(`[worker] FAIL: ${inv.invoiceNo} -> ${phone}`, e?.message ?? e);
    }
  }
}

async function main() {
  console.log("[worker] Started. Jadwal: tiap jam (menit 0).");
  await processDueInvoices();

  // Cron rule: every hour at minute 0
  cron.schedule("0 * * * *", () => {
    processDueInvoices().catch((e) => console.error("[worker] error", e));
  });
}

main().catch((e) => {
  console.error("[worker] fatal", e);
  process.exit(1);
});

