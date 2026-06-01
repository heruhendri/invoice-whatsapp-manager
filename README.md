# Invoice WhatsApp Manager (Next.js)

Aplikasi web berbasis **Next.js** untuk:
- Manajemen **pelanggan** & **invoice**
- Generate **invoice PDF** (layout mengikuti contoh)
- Notifikasi **WhatsApp** via **Baileys** (scan QR)
- **Scheduler per jam** untuk kirim invoice otomatis saat jatuh tempo
- UI admin panel dengan **dark/light mode** dan gradasi **biru tua ↔ biru muda**

## 1) Prasyarat
- Node.js 18+ (disarankan 20+)
- MySQL / MariaDB

## 2) Setup Environment
Salin contoh env:
```bash
cp .env.example .env
```

Isi minimal:
```bash
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DBNAME"
```

## 3) Setup Database (Prisma)
```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

## 4) Jalankan Web
```bash
npm run dev
```
Buka: `http://localhost:3000`

## 5) Hubungkan WhatsApp (Scan QR)
1. Buka menu **Status WhatsApp**
2. QR akan muncul (refresh otomatis tiap 5 detik)
3. Scan QR dari WhatsApp di HP

Sesi akan tersimpan di folder:
```
data/wa_auth
```

## 6) Kirim Invoice Manual
Di menu **Tagihan / Invoice**:
- tombol **PDF**: preview/unduh
- tombol **Kirim WA**: kirim pesan + lampiran PDF

## 7) Kirim Otomatis (Scheduler per jam)
Jalankan worker:
```bash
npm run worker
```

Worker akan:
- cek invoice dengan `dueDate <= now` tiap jam
- mencegah double-send menggunakan `lastSentAt`
- tulis log ke tabel `InvoiceDeliveryLog`

> Catatan: worker butuh WhatsApp sudah terhubung (scan QR dulu).

## Template Pesan WhatsApp
Edit di menu **Pengaturan**.

Variabel yang tersedia:
- `{{nama}}`
- `{{invoiceNo}}`
- `{{total}}`
- `{{dueDate}}`
