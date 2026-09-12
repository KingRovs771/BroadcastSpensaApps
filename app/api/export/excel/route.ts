import { NextRequest, NextResponse } from "next/server";
import { INITIAL_ANGGOTA, INITIAL_KAS_PEMBAYARAN } from "@/lib/mock/store";
import { calculateKasSummary } from "@/lib/utils/kas-calc";

export async function GET(request: NextRequest) {
  const kasSummary = calculateKasSummary(INITIAL_KAS_PEMBAYARAN);

  return NextResponse.json({
    title: "Export Data Broadcast Spensa",
    exported_at: new Date().toISOString(),
    members_count: INITIAL_ANGGOTA.length,
    kas_summary: kasSummary,
    status: "ready",
  });
}
