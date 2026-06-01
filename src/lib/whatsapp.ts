import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import path from "node:path";
import fs from "node:fs";

type WaState = {
  sock?: WASocket;
  qr?: string;
  connected: boolean;
  me?: string;
  lastError?: string;
};

const state: WaState = {
  connected: false,
};

const AUTH_DIR = path.join(process.cwd(), "data", "wa_auth");
const DATA_DIR = path.join(process.cwd(), "data");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });
}

export async function initWhatsApp() {
  if (state.sock) return state.sock;
  ensureDirs();

  const { state: authState, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: authState,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
  });

  state.sock = sock;

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) state.qr = qr;

    if (connection === "open") {
      state.connected = true;
      state.qr = undefined;
      state.me = sock.user?.id;
      state.lastError = undefined;
    }

    if (connection === "close") {
      const err = lastDisconnect?.error as Boom | undefined;
      const reason = err?.output?.statusCode;
      state.connected = false;

      if (reason === DisconnectReason.loggedOut) {
        state.lastError = "Logged out. Scan QR ulang.";
        state.sock = undefined;
      } else {
        state.lastError = `Disconnected (${reason ?? "unknown"})`;
        state.sock = undefined;
      }
    }
  });

  return sock;
}

export async function getWaStatus() {
  await initWhatsApp();
  const qrDataUrl = state.qr
    ? await QRCode.toDataURL(state.qr, { margin: 1, width: 320 })
    : undefined;

  return {
    connected: state.connected,
    qrDataUrl,
    me: state.me,
    lastError: state.lastError,
  };
}

export async function sendWhatsAppMessage(
  phoneNumberE164OrLocal: string,
  text: string,
  pdfBuffer?: Buffer,
  pdfFileName = "invoice.pdf",
) {
  const sock = await initWhatsApp();

  // Normalize: expect input like +62812... or 0812...
  let num = phoneNumberE164OrLocal.replace(/\D/g, "");
  if (num.startsWith("0")) num = "62" + num.slice(1);
  if (!num.startsWith("62")) {
    // fallback: treat as already country-coded
  }

  const jid = `${num}@s.whatsapp.net`;

  if (pdfBuffer) {
    await sock.sendMessage(jid, {
      document: pdfBuffer,
      fileName: pdfFileName,
      mimetype: "application/pdf",
      caption: text,
    });
  } else {
    await sock.sendMessage(jid, { text });
  }
}

