import { AnggotaRecord } from "@/lib/mock/store";

/**
 * Utility untuk mengekspor data anggota (Ekskul / Tetap / Semua) ke format CSV / Excel
 * yang kompatibel penuh dengan Microsoft Excel, Google Sheets, dan LibreOffice.
 */

export function exportAnggotaToCSV(
  data: AnggotaRecord[],
  filenamePrefix: string = "Data_Anggota_Ekskul"
) {
  if (!data || data.length === 0) {
    alert("Tidak ada data anggota untuk diekspor.");
    return;
  }

  // Header Kolom
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
    "No. HP / WhatsApp",
  ];

  // Konversi baris data
  const rows = data.map((item, index) => [
    index + 1,
    `"${(item.nama_lengkap || "").replace(/"/g, '""')}"`,
    item.tipe === "ekskul" ? "Anggota Ekskul" : "Anggota Tetap",
    `'${item.nis || ""}`, // Prefix petik agar Excel tidak menghapus angka nol di depan
    item.nisn ? `'${item.nisn}` : "-",
    item.kelas || "-",
    `"${(item.jabatan || "").replace(/"/g, '""')}"`,
    item.divisi ? `"${item.divisi}"` : "-",
    item.tahun_ajaran || "-",
    (item.status || "aktif").toUpperCase(),
    item.no_hp ? `'${item.no_hp}` : "-",
  ]);

  // Gabungkan CSV dengan delimiter koma
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\r\n");

  // Tambahkan BOM \uFEFF agar Microsoft Excel membaca encoding UTF-8 dengan benar
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_Broadcast_Spensa_${dateStr}.csv`;

  // Trigger download di browser
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
