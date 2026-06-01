import PDFDocument from "pdfkit";
import { formatNumberID } from "./format";
import { getSettings } from "./settings";
import { prisma } from "./prisma";

function money(amount: number) {
  return `Rp${formatNumberID(amount)}`;
}

export async function generateInvoicePdfBuffer(invoiceId: number) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true },
  });
  if (!invoice) throw new Error("Invoice tidak ditemukan");

  const settings = await getSettings();

  const doc = new PDFDocument({ size: "A4", margin: 48 });
  const chunks: Buffer[] = [];

  doc.on("data", (d) => chunks.push(Buffer.from(d)));

  const endPromise = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // --- Styles ---
  const pageWidth = doc.page.width;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;
  const top = doc.page.margins.top;
  const primary = "#0B3B8C";
  const muted = "#334155";

  // Header left
  doc
    .font("Helvetica-Bold")
    .fontSize(16)
    .fillColor("#0f172a")
    .text(settings.companyName.toUpperCase(), left, top);

  doc
    .font("Helvetica")
    .fontSize(9.5)
    .fillColor(muted)
    .text(settings.companyAddress, left, top + 22, { width: 280 });

  doc.text(`Telepon: ${settings.companyPhone}`, left, top + 40, {
    width: 280,
  });
  doc.text(`Email: ${settings.companyEmail}`, left, top + 56, { width: 280 });

  // Header right (title + meta)
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#0f172a")
    .text("INVOICE", left, top, { align: "right" });

  const metaTop = top + 26;
  doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
  doc.text(`No : ${invoice.invoiceNo}`, left, metaTop, { align: "right" });
  doc.text(`Tanggal: ${formatDate(invoice.issueDate)}`, left, metaTop + 16, {
    align: "right",
  });
  doc.text(
    `Tgl. Jatuh Tempo: ${formatDate(invoice.dueDate)}`,
    left,
    metaTop + 32,
    { align: "right" },
  );

  // Divider
  doc
    .moveTo(left, top + 90)
    .lineTo(right, top + 90)
    .lineWidth(1)
    .strokeColor("#e2e8f0")
    .stroke();

  // Customer + amount due
  const blockTop = top + 110;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a");
  doc.text("Kepada Yth.", left, blockTop);
  doc.font("Helvetica").fontSize(10).fillColor(muted);
  doc.text(invoice.customerName, left, blockTop + 16);
  if (invoice.customerAddress)
    doc.text(`Alamat: ${invoice.customerAddress}`, left, blockTop + 32);
  if (invoice.customerPhone)
    doc.text(`Telepon: ${invoice.customerPhone}`, left, blockTop + 48);
  if (invoice.customerEmail)
    doc.text(`Email: ${invoice.customerEmail}`, left, blockTop + 64);

  const amountBoxW = 220;
  const amountBoxH = 78;
  const amountX = right - amountBoxW;
  const amountY = blockTop - 4;
  doc
    .roundedRect(amountX, amountY, amountBoxW, amountBoxH, 10)
    .fillOpacity(1)
    .fillAndStroke("#0b1220", "#1e293b");

  doc
    .fillColor("#94a3b8")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("JUMLAH YANG HARUS DIBAYAR", amountX + 14, amountY + 14, {
      width: amountBoxW - 28,
      align: "left",
    });

  doc
    .fillColor("#ffffff")
    .fontSize(18)
    .text(money(invoice.total), amountX + 14, amountY + 36, {
      width: amountBoxW - 28,
      align: "left",
    });

  // Items table
  const tableTop = blockTop + 96;
  const colDescW = 280;
  const colQtyW = 60;
  const colPriceW = 90;
  const colTotalW = 90;

  // Table header bg
  doc
    .roundedRect(left, tableTop, right - left, 24, 10)
    .fill(primary)
    .fillOpacity(1);

  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(9.5);
  doc.text("DESKRIPSI", left + 12, tableTop + 7, { width: colDescW });
  doc.text("JUMLAH", left + colDescW + 12, tableTop + 7, {
    width: colQtyW,
    align: "right",
  });
  doc.text("HARGA", left + colDescW + colQtyW + 12, tableTop + 7, {
    width: colPriceW,
    align: "right",
  });
  doc.text("TOTAL", left + colDescW + colQtyW + colPriceW + 12, tableTop + 7, {
    width: colTotalW,
    align: "right",
  });

  let y = tableTop + 30;
  doc.font("Helvetica").fontSize(10).fillColor("#0f172a");

  for (const item of invoice.items) {
    const rowH = 22;
    // zebra
    if ((invoice.items.indexOf(item) ?? 0) % 2 === 0) {
      doc
        .rect(left, y - 2, right - left, rowH)
        .fillOpacity(0.06)
        .fill("#94a3b8");
      doc.fillOpacity(1);
    }

    doc.fillColor("#0f172a");
    doc.text(item.description, left + 12, y, { width: colDescW });
    doc.text(String(item.qty), left + colDescW + 12, y, {
      width: colQtyW,
      align: "right",
    });
    doc.text(formatNumberID(item.unitPrice), left + colDescW + colQtyW + 12, y, {
      width: colPriceW,
      align: "right",
    });
    doc.text(formatNumberID(item.lineTotal), left + colDescW + colQtyW + colPriceW + 12, y, {
      width: colTotalW,
      align: "right",
    });
    y += rowH;
  }

  // Totals + payment
  const totalsTop = y + 18;
  const leftBoxW = 300;

  doc.font("Helvetica-Bold").fontSize(10).fillColor("#0f172a");
  doc.text("Metode Pembayaran", left, totalsTop);
  doc.font("Helvetica").fontSize(10).fillColor(muted);
  doc.text(`Bank: ${invoice.paymentBankName || settings.paymentBankName}`, left, totalsTop + 18);
  doc.text(
    `No. Rek: ${invoice.paymentAccountNumber || settings.paymentAccountNumber}`,
    left,
    totalsTop + 34,
  );
  doc.text(
    `Atas Nama: ${invoice.paymentAccountName || settings.paymentAccountName}`,
    left,
    totalsTop + 50,
    { width: leftBoxW },
  );

  const totalsX = right - 220;
  doc.font("Helvetica").fontSize(10).fillColor("#0f172a");
  drawTotalRow(doc, totalsX, totalsTop, "Sub Total", money(invoice.subtotal));
  drawTotalRow(doc, totalsX, totalsTop + 18, "Diskon", money(invoice.discount));
  drawTotalRow(doc, totalsX, totalsTop + 36, "Pajak", money(invoice.tax));
  doc.font("Helvetica-Bold");
  drawTotalRow(doc, totalsX, totalsTop + 54, "Total", money(invoice.total));

  // Footer
  const footerTop = doc.page.height - doc.page.margins.bottom - 90;
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f172a");
  doc.text("TERIMA KASIH", left, footerTop);

  doc.font("Helvetica").fontSize(10).fillColor(muted);
  doc.text(settings.companyName.toUpperCase(), right - 220, footerTop + 40, {
    width: 220,
    align: "right",
  });

  doc.end();
  return endPromise;
}

function drawTotalRow(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  label: string,
  value: string,
) {
  doc.text(label, x, y, { width: 120 });
  doc.text(value, x + 120, y, { width: 100, align: "right" });
}

function formatDate(d: Date) {
  // output similar to sample: 1-Mar-2026
  const m = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];
  return `${d.getDate()}-${m[d.getMonth()]}-${d.getFullYear()}`;
}

