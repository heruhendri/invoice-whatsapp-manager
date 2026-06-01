export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";
import { getSettings } from "@/lib/settings";
import { formatIDR } from "@/lib/format";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isFinite(invoiceId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phone = invoice.customerPhone?.trim();
  if (!phone) {
    return NextResponse.json(
      { error: "Pelanggan belum punya nomor WhatsApp" },
      { status: 400 },
    );
  }

  const settings = await getSettings();
  const text = renderTemplate(settings.whatsappMessageTemplate, {
    nama: invoice.customerName,
    invoiceNo: invoice.invoiceNo,
    total: formatIDR(invoice.total),
    dueDate: invoice.dueDate.toISOString().slice(0, 10),
  });

  try {
    const pdf = await generateInvoicePdfBuffer(invoiceId);
    await sendWhatsAppMessage(phone, text, pdf, `invoice-${invoice.invoiceNo}.pdf`);

    await prisma.$transaction([
      prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: invoice.status === "PAID" ? "PAID" : "SENT",
          sentAt: invoice.sentAt ?? new Date(),
          lastSentAt: new Date(),
        },
      }),
      prisma.invoiceDeliveryLog.create({
        data: {
          invoiceId,
          channel: "WHATSAPP",
          status: "SUCCESS",
        },
      }),
    ]);

    return NextResponse.redirect(new URL("/invoices", req.url), 303);
  } catch (e: any) {
    await prisma.invoiceDeliveryLog.create({
      data: {
        invoiceId,
        channel: "WHATSAPP",
        status: "FAILED",
        detail: String(e?.message ?? e),
      },
    });
    return NextResponse.json({ error: "Gagal kirim WhatsApp", detail: String(e?.message ?? e) }, { status: 500 });
  }
}

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
}
