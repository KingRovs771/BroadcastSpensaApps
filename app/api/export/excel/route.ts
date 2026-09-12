import { NextRequest, NextResponse } from "next/server";
import { createServer } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tipe = searchParams.get("type") || "ekskul"; // 'ekskul' | 'tetap' | 'all'
  const format = searchParams.get("format");

  const supabase = createServer();
  let query = supabase.from("anggota").select("*");

  if (tipe === "ekskul" || tipe === "tetap") {
    query = query.eq("tipe", tipe);
  }

  const { data: members, error } = await query.order("nama_lengkap", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (format === "json") {
    return NextResponse.json({
      title: `Export Data Anggota ${tipe.toUpperCase()} Broadcast Spensa`,
      exported_at: new Date().toISOString(),
      count: members ? members.length : 0,
      data: members || [],
    });
  }

  // Generate CSV with UTF-8 BOM
  const headers = [
    "No",
    "Nama Lengkap",
    "Tipe Keanggotaan",
    "NIS",
    "NISN",
    "Kelas",
    "Jabatan",
    "Divisi",
    "Tahun Ajaran",
    "Status",
    "No. WhatsApp / HP",
  ];

  const rows = (members || []).map((item: any, index: number) => [
    index + 1,
    `"${(item.nama_lengkap || "").replace(/"/g, '""')}"`,
    item.tipe === "ekskul" ? "Anggota Ekskul" : "Anggota Tetap",
    `'${item.nis || ""}`,
    item.nisn ? `'${item.nisn}` : "-",
    item.kelas || "-",
    `"${(item.jabatan || "").replace(/"/g, '""')}"`,
    item.divisi ? `"${item.divisi}"` : "-",
    item.tahun_ajaran || "-",
    (item.status || "aktif").toUpperCase(),
    item.no_hp ? `'${item.no_hp}` : "-",
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\r\n");

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Data_Anggota_${tipe.toUpperCase()}_Broadcast_Spensa_${dateStr}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
