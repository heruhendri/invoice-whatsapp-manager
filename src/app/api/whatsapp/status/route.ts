export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getWaStatus } from "@/lib/whatsapp";

export async function GET() {
  const status = await getWaStatus();
  return NextResponse.json(status);
}

