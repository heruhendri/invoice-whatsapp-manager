export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const invoiceId = Number(id);
  if (!Number.isFinite(invoiceId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const pdf = await generateInvoicePdfBuffer(invoiceId);

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename=\"invoice-${invoiceId}.pdf\"`,
    },
  });
}
