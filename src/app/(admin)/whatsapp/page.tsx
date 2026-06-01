"use client";

import { useEffect, useState } from "react";

type WaStatus = {
  connected: boolean;
  qrDataUrl?: string;
  me?: string;
  lastError?: string;
};

export default function WhatsAppPage() {
  const [data, setData] = useState<WaStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
      const json = (await res.json()) as WaStatus;
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <div className="text-xl font-semibold text-slate-900 dark:text-white">
          Status WhatsApp
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          Scan QR sekali untuk menghubungkan bot, lalu sistem bisa kirim invoice
          otomatis saat jatuh tempo.
        </div>
      </div>

      <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-100 shadow backdrop-blur dark:bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Koneksi</div>
            <button
              onClick={refresh}
              className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-100 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <div className="mt-3 text-sm">
            {loading && <div className="text-slate-300">Memuat...</div>}
            {!loading && data && (
              <div className="space-y-2">
                <div>
                  Status:{" "}
                  <span
                    className={
                      data.connected ? "text-emerald-300" : "text-amber-300"
                    }
                  >
                    {data.connected ? "TERHUBUNG" : "BELUM TERHUBUNG"}
                  </span>
                </div>
                {data.me && (
                  <div className="text-slate-300 text-xs">Akun: {data.me}</div>
                )}
                {data.lastError && (
                  <div className="text-rose-300 text-xs">
                    Error terakhir: {data.lastError}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-slate-100 shadow backdrop-blur dark:bg-slate-950/40">
          <div className="text-sm font-semibold">QR Code</div>
          <div className="mt-3">
            {data?.connected ? (
              <div className="text-sm text-slate-300">
                Sudah terhubung. QR tidak diperlukan.
              </div>
            ) : data?.qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.qrDataUrl}
                alt="WhatsApp QR"
                className="mx-auto w-[260px] rounded-xl bg-white p-3"
              />
            ) : (
              <div className="text-sm text-slate-300">
                QR belum tersedia. Refresh beberapa saat lagi.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

