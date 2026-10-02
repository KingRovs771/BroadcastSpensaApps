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

  const headers = [
    "No", "Nama Lengkap", "Tipe Keanggotaan", "NIS", "NISN",
    "Kelas", "Jabatan", "Divisi", "Tahun Ajaran", "Status", "No. HP / WhatsApp",
  ];

  const rows = data.map((item, index) => [
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

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `${filenamePrefix}_Broadcast_Spensa_${dateStr}.csv`;
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

// ─── Types untuk Import CSV ───────────────────────────────────────────────────

export interface ImportedAnggotaRow {
  nama_lengkap: string;
  tipe: "tetap" | "ekskul";
  nis: string;
  nisn?: string;
  kelas: string;
  jabatan: string;
  divisi?: string;
  tahun_ajaran: string;
  status: "aktif" | "cuti" | "non-aktif";
  no_hp?: string;
  _rowIndex: number;
  _errors: string[];
}

export interface ParseCSVResult {
  valid: ImportedAnggotaRow[];
  invalid: ImportedAnggotaRow[];
  total: number;
}

/**
 * Mem-parse CSV hasil exportAnggotaToCSV() atau file CSV yang dibuka/disimpan ulang
 * via Excel Indonesia (delimiter ; dan notasi saintifik untuk angka besar).
 *
 * Perbaikan:
 * - Auto-detect delimiter: koma (,) vs titik koma (;)
 * - Handle scientific notation: 1,12E+08 → "112000000"
 * - Lebih toleran: kelas kosong tidak membuat baris invalid
 */
export function parseAnggotaFromCSV(csvText: string): ParseCSVResult {
  const cleaned = csvText.replace(/^\uFEFF/, "").trim();
  const lines = cleaned.split(/\r?\n/);
  if (lines.length < 2) return { valid: [], invalid: [], total: 0 };

  // ── Auto-detect delimiter: hitung jumlah `;` vs `,` pada baris header ──
  const headerLine = lines[0];
  const semicolonCount = (headerLine.match(/;/g) || []).length;
  const commaCount = (headerLine.match(/,/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : ",";

  const dataLines = lines.slice(1).filter((l) => l.trim() !== "");
  const valid: ImportedAnggotaRow[] = [];
  const invalid: ImportedAnggotaRow[] = [];

  dataLines.forEach((line, idx) => {
    const rowIndex = idx + 2;
    const cols = parseCSVLine(line, delimiter);
    const [, namaCol, tipeCol, nisCol, nisnCol, kelasCol, jabatanCol, divisiCol, tahunCol, statusCol, hpCol] = cols;
    const errors: string[] = [];

    const nama = (namaCol || "").trim();
    if (!nama) errors.push("Nama Lengkap kosong");

    // Bersihkan NIS dari prefix petik dan scientific notation
    const nis = cleanNumericField(nisCol);
    if (!nis) errors.push("NIS kosong");

    // NISN boleh kosong — tidak wajib
    const nisnClean = cleanNumericField(nisnCol);
    const nisn = nisnClean || undefined;

    // Kelas tidak wajib — bisa kosong
    const kelas = (kelasCol || "").trim().replace(/^-$/, "");

    const jabatan = (jabatanCol || "").replace(/^"+|"+$/g, "").trim() || "Anggota";
    const divisiRaw = (divisiCol || "").replace(/^"+|"+$/g, "").trim();
    const divisi = divisiRaw === "-" || divisiRaw === "" ? undefined : divisiRaw;
    const tahunRaw = (tahunCol || "").trim();
    const tahun_ajaran = tahunRaw === "-" || tahunRaw === "" ? "2026/2027" : tahunRaw;

    const resolveStatus = (s: string): "aktif" | "cuti" | "non-aktif" => {
      const lower = s.toLowerCase();
      if (lower === "cuti") return "cuti";
      if (lower === "non-aktif" || lower === "nonaktif") return "non-aktif";
      return "aktif";
    };
    const status = resolveStatus(statusCol || "aktif");

    const no_hp = cleanNumericField(hpCol) || undefined;
    const tipe: "tetap" | "ekskul" = (tipeCol || "").toLowerCase().includes("ekskul") ? "ekskul" : "tetap";

    const row: ImportedAnggotaRow = {
      nama_lengkap: nama,
      tipe,
      nis,
      nisn,
      kelas,
      jabatan,
      divisi,
      tahun_ajaran,
      status,
      no_hp,
      _rowIndex: rowIndex,
      _errors: errors,
    };

    if (errors.length === 0) valid.push(row);
    else invalid.push(row);
  });

  return { valid, invalid, total: dataLines.length };
}


/** Download template CSV kosong siap diisi. */
export function downloadImportTemplate(tipe: "tetap" | "ekskul" = "tetap") {
  const headers = [
    "No", "Nama Lengkap", "Tipe Keanggotaan", "NIS", "NISN",
    "Kelas", "Jabatan", "Divisi", "Tahun Ajaran", "Status", "No. HP / WhatsApp",
  ];
  const exampleRow = [
    "1", "Nama Siswa Contoh",
    tipe === "tetap" ? "Anggota Tetap" : "Anggota Ekskul",
    "16000", "0123456789", "IX-A", "Anggota",
    tipe === "tetap" ? "Broadcasting" : "-",
    "2026/2027", "AKTIF", "081234567890",
  ];
  const csvContent = [headers.join(","), exampleRow.join(",")].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.setAttribute("href", URL.createObjectURL(blob));
  link.setAttribute("download", `Template_Import_Anggota_${tipe === "tetap" ? "Tetap" : "Ekskul"}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Helper: parse satu baris CSV dengan benar (handle quoted fields, support multiple delimiters) */
function parseCSVLine(line: string, delimiter = ","): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Bersihkan field numerik dari:
 * - Prefix petik (') yang ditambahkan saat ekspor: '16279 → 16279
 * - Scientific notation dari Excel: 1,12E+08 atau 1.12E+08 → 112000000
 * - Spasi dan karakter tidak perlu
 */
function cleanNumericField(raw: string | undefined): string {
  if (!raw) return "";
  let s = raw.replace(/^'+/, "").trim();
  if (s === "-" || s === "") return "";

  // Deteksi scientific notation: angka seperti 1,12E+08 atau 1.12E+08
  // Excel Indonesia menggunakan koma sebagai desimal: 1,12E+08
  const sciNotationRegex = /^([0-9]+)[,.]([0-9]+)[Ee][+]?([0-9]+)$/;
  const sciMatch = s.match(sciNotationRegex);
  if (sciMatch) {
    // Konversi: mantissa × 10^exponent → integer string
    const mantissa = parseFloat(sciMatch[1] + "." + sciMatch[2]);
    const exponent = parseInt(sciMatch[3], 10);
    const value = Math.round(mantissa * Math.pow(10, exponent));
    return value.toString();
  }

  // Hapus titik/koma ribuan jika ada: 16.279 → 16279
  // Hanya jika hasilnya masih berupa angka
  const cleaned = s.replace(/[.,]/g, "");
  if (/^\d+$/.test(cleaned) && cleaned.length <= 20) {
    return cleaned;
  }

  return s;
}
