import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ImportedAnggotaRow } from "@/lib/utils/excel";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rows: ImportedAnggotaRow[] = body.rows;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada baris data anggota yang dikirim." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Siapkan payload data untuk upsert ke public.anggota
    const recordsToUpsert = rows.map((r) => ({
      tipe: r.tipe,
      nama_lengkap: r.nama_lengkap.trim(),
      nis: r.nis.trim(),
      nisn: r.nisn?.trim() || null,
      kelas: r.kelas?.trim() || "-",
      jabatan: r.jabatan?.trim() || "Anggota",
      divisi: r.tipe === "tetap" ? (r.divisi || null) : null,
      tahun_ajaran: r.tahun_ajaran || "2026/2027",
      status: r.status || "aktif",
      no_hp: r.no_hp?.trim() || null,
    }));

    // Eksekusi upsert dengan conflict target 'nis'
    // Sehingga data baru ditambahkan, dan jika NIS sudah ada, data terbarunya diperbarui
    const { data, error } = await adminClient
      .from("anggota")
      .upsert(recordsToUpsert, { onConflict: "nis" })
      .select();

    if (error) {
      console.error("Database error during bulk upsert anggota:", error);
      return NextResponse.json(
        { error: `Gagal menyimpan ke database: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${data?.length || recordsToUpsert.length} data anggota.`,
      count: data?.length || recordsToUpsert.length,
      records: data || [],
    });
  } catch (err: unknown) {
    console.error("Unhandled error in api/anggota/import:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server saat mengimpor data." },
      { status: 500 }
    );
  }
}
