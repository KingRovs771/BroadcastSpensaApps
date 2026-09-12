import { NextRequest, NextResponse } from "next/server";
import { getAcademicSemester } from "@/lib/utils/semester";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const academic = getAcademicSemester(new Date());

    return NextResponse.json({
      success: true,
      report_id: `rep-${Date.now()}`,
      semester: academic.semester,
      tahun_ajaran: academic.tahunAjaran,
      label: academic.label,
      with_ttd: body.with_ttd ?? true,
      timestamp: new Date().toISOString(),
      generator: "Broadcast Spensa Reporting Engine v3.0.0",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: "Gagal menghasilkan laporan" },
      { status: 500 }
    );
  }
}
