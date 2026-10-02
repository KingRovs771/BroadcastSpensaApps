import { AnggotaRecord, DivisiName } from "@/lib/mock/store";

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
  divisi?: DivisiName;
  tahun_ajaran: string;
  status: "aktif" | "cuti" | "lulus" | "nonaktif";
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
 * Normalisasi nama divisi dari berbagai variasi teks (termasuk yang terpotong di Excel)
 * agar sesuai persis dengan enum DivisiName dan constraint database.
 */
export function normalizeDivisi(raw: string | undefined): DivisiName | undefined {
  if (!raw) return undefined;
  const s = raw.trim().replace(/^["']+|["']+$/g, "").toLowerCase();
  if (s === "-" || s === "" || s === "null" || s === "undefined") return undefined;

  if (s.startsWith("kreat") || s.includes("kreatif")) return "Kreatif";
  if (s.startsWith("pres") || s.includes("presenter")) return "Presenter";
  if (s.startsWith("foto") || s.includes("fotografer") || s.includes("photo")) return "Fotografer";
  if (s.startsWith("video") || s.includes("videografer")) return "Videografer";
  if (s.startsWith("broad") || s.includes("broadcast")) return "Broadcasting";
  if (s.startsWith("edit") || s.includes("editor")) return "Editor";
  if (s.startsWith("prom") || s.includes("promosi") || s.includes("digital")) return "Promosi Digital";

  return undefined;
}

/**
 * Normalisasi status keanggotaan agar sesuai dengan PostgreSQL CHECK constraint:
 * ('aktif', 'cuti', 'lulus', 'nonaktif')
 */
export function normalizeStatus(raw: string | undefined): "aktif" | "cuti" | "lulus" | "nonaktif" {
  if (!raw) return "aktif";
  const s = raw.trim().toLowerCase();
  if (s.includes("cuti")) return "cuti";
  if (s.includes("lulus")) return "lulus";
  if (s.includes("non") || s.includes("pasif") || s.includes("keluar") || s.includes("tidak")) return "nonaktif";
  return "aktif";
}

/**
 * Mem-parse CSV hasil exportAnggotaToCSV() atau file CSV dari Excel.
 *
 * Fitur Adaptif:
 * - Auto-detect delimiter: titik koma (;), koma (,), atau tab (\t)
 * - Auto-detect apakah baris 1 adalah Header atau langsung Data Anggota
 * - Auto-detect susunan kolom:
 *     * 11 kolom (dengan No di kolom A)
 *     * 10 kolom (tanpa No, langsung Nama Lengkap di kolom A)
 *     * Custom mapping berdasarkan nama header jika ada
 * - Normalisasi divisi otomatis: "Broadcasti" -> "Broadcasting", "Promosi D" -> "Promosi Digital", "Videografe" -> "Videografer"
 * - Normalisasi status: "AKTIF" -> "aktif", "non-aktif" -> "nonaktif"
 * - Handle scientific notation dari Excel: 1,12E+08 -> "112000000"
 * - Restorasi zero-padding NISN 9 digit -> 10 digit (011...)
 * - Toleran: kelas kosong fallback ke "-" agar tidak melanggar NOT NULL DB
 */
export function parseAnggotaFromCSV(csvText: string): ParseCSVResult {
  const cleaned = csvText.replace(/^\uFEFF/, "").trim();
  const allLines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  if (allLines.length === 0) return { valid: [], invalid: [], total: 0 };

  // 1. Auto-detect delimiter dari 5 baris pertama
  const sample = allLines.slice(0, 5).join("\n");
  const semicolonCount = (sample.match(/;/g) || []).length;
  const commaCount = (sample.match(/,/g) || []).length;
  const tabCount = (sample.match(/\t/g) || []).length;
  let delimiter = ",";
  if (semicolonCount > commaCount && semicolonCount > tabCount) delimiter = ";";
  else if (tabCount > commaCount && tabCount > semicolonCount) delimiter = "\t";

  // 2. Deteksi apakah baris pertama adalah Header atau Data
  const firstLineCols = parseCSVLine(allLines[0], delimiter).map((c) => c.toLowerCase().trim());
  const headerKeywords = ["nama", "name", "nis", "nisn", "keanggotaan", "kelas", "jabatan", "divisi", "tahun", "status"];
  const matchedKeywords = firstLineCols.filter((col) =>
    headerKeywords.some((kw) => col.includes(kw))
  );

  const hasHeader = matchedKeywords.length >= 2;
  const dataLines = hasHeader ? allLines.slice(1) : allLines;
  const startRowOffset = hasHeader ? 2 : 1;

  // 3. Tentukan pemetaan kolom (Header mapping vs Positional mapping)
  let namaIdx = -1;
  let tipeIdx = -1;
  let nisIdx = -1;
  let nisnIdx = -1;
  let kelasIdx = -1;
  let jabatanIdx = -1;
  let divisiIdx = -1;
  let tahunIdx = -1;
  let statusIdx = -1;
  let hpIdx = -1;

  if (hasHeader) {
    firstLineCols.forEach((col, idx) => {
      if (col.includes("nisn")) nisnIdx = idx;
      else if (col.includes("nis")) nisIdx = idx;
      else if (col.includes("nama") || col.includes("name")) namaIdx = idx;
      else if (col.includes("tipe") || col.includes("keanggotaan")) tipeIdx = idx;
      else if (col.includes("kelas") || col.includes("class") || col.includes("rombel")) kelasIdx = idx;
      else if (col.includes("jabatan") || col.includes("peran") || col.includes("role")) jabatanIdx = idx;
      else if (col.includes("divisi") || col.includes("div") || col.includes("bidang")) divisiIdx = idx;
      else if (col.includes("tahun") || col.includes("ajaran") || col.includes("periode")) tahunIdx = idx;
      else if (col.includes("status") || col.includes("keaktifan")) statusIdx = idx;
      else if (col.includes("hp") || col.includes("wa") || col.includes("telepon") || col.includes("phone")) hpIdx = idx;
    });
  }

  // Fallback positional mapping jika header tidak ada atau tidak lengkap
  const sampleRowCols = dataLines.length > 0 ? parseCSVLine(dataLines[0], delimiter) : [];
  const col0IsNumber = /^\d+$/.test(sampleRowCols[0]?.trim() || "");
  const hasNoColumn = col0IsNumber && (sampleRowCols.length >= 11 || (namaIdx === -1 && sampleRowCols[1]?.length > 2));

  // Jika belum terpetakan, gunakan layout default
  if (namaIdx === -1) {
    if (hasNoColumn) {
      // Layout 11 kolom: [No, Nama, Tipe, NIS, NISN, Kelas, Jabatan, Divisi, Tahun, Status, HP]
      namaIdx = 1;
      tipeIdx = 2;
      nisIdx = 3;
      nisnIdx = 4;
      kelasIdx = 5;
      jabatanIdx = 6;
      divisiIdx = 7;
      tahunIdx = 8;
      statusIdx = 9;
      hpIdx = 10;
    } else {
      // Layout 10 kolom (seperti screenshot Excel user):
      // [Nama Lengkap, Tipe, NIS, NISN, Kelas, Jabatan, Divisi, Tahun, Status, HP]
      namaIdx = 0;
      tipeIdx = 1;
      nisIdx = 2;
      nisnIdx = 3;
      kelasIdx = 4;
      jabatanIdx = 5;
      divisiIdx = 6;
      tahunIdx = 7;
      statusIdx = 8;
      hpIdx = 9;
    }
  }

  const valid: ImportedAnggotaRow[] = [];
  const invalid: ImportedAnggotaRow[] = [];

  dataLines.forEach((line, idx) => {
    const rowIndex = idx + startRowOffset;
    const cols = parseCSVLine(line, delimiter);
    if (cols.length === 0 || (cols.length === 1 && cols[0] === "")) return;

    const errors: string[] = [];

    const nama = (cols[namaIdx] || "").trim().replace(/^["']+|["']+$/g, "");
    if (!nama) errors.push("Nama Lengkap kosong");

    // Bersihkan NIS dari prefix petik dan scientific notation
    const nis = cleanNumericField(cols[nisIdx]);
    if (!nis) errors.push("NIS kosong");

    // NISN boleh kosong — tidak wajib
    let nisnClean = cleanNumericField(cols[nisnIdx]);
    // Jika NISN 9 digit (Excel memotong 0 di depan), tambahkan kembali '0'
    if (nisnClean && nisnClean.length === 9) {
      nisnClean = "0" + nisnClean;
    }
    const nisn = nisnClean || undefined;

    // Kelas tidak wajib — fallback ke "-" jika kosong agar aman untuk NOT NULL constraint DB
    const kelasRaw = (cols[kelasIdx] || "").trim().replace(/^["']+|["']+$/g, "").replace(/^-$/, "");
    const kelas = kelasRaw || "-";

    const jabatanRaw = (cols[jabatanIdx] || "").trim().replace(/^["']+|["']+$/g, "");
    const jabatan = jabatanRaw || "Anggota";

    // Normalisasi divisi secara pintar (misal: "Broadcasti" -> "Broadcasting", "Promosi D" -> "Promosi Digital")
    const divisiRaw = cols[divisiIdx];
    const divisi = normalizeDivisi(divisiRaw);

    const tahunRaw = (cols[tahunIdx] || "").trim().replace(/^["']+|["']+$/g, "");
    const tahun_ajaran = tahunRaw === "-" || tahunRaw === "" ? "2026/2027" : tahunRaw;

    // Normalisasi status ke ('aktif' | 'cuti' | 'lulus' | 'nonaktif')
    const status = normalizeStatus(cols[statusIdx]);

    const no_hp = cleanNumericField(cols[hpIdx]) || undefined;
    const tipeRaw = (cols[tipeIdx] || "").toLowerCase();
    const tipe: "tetap" | "ekskul" = tipeRaw.includes("ekskul") ? "ekskul" : "tetap";

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
  let s = raw.replace(/^['"]+/, "").replace(/['"]+$/, "").trim();
  if (s === "-" || s === "") return "";

  // Deteksi scientific notation: angka seperti 1,12E+08 atau 1.12E+08 atau 3,12E+09
  // Excel Indonesia menggunakan koma sebagai desimal: 1,12E+08
  const sciNotationRegex = /^([0-9]+)[,.]([0-9]+)[Ee][+]?([0-9]+)$/;
  const sciMatch = s.match(sciNotationRegex);
  if (sciMatch) {
    const mantissa = parseFloat(sciMatch[1] + "." + sciMatch[2]);
    const exponent = parseInt(sciMatch[3], 10);
    const value = Math.round(mantissa * Math.pow(10, exponent));
    return value.toString();
  }

  // Hapus titik/koma ribuan jika ada: 16.279 → 16279
  const cleaned = s.replace(/[.,]/g, "");
  if (/^\d+$/.test(cleaned) && cleaned.length <= 20) {
    return cleaned;
  }

  return s;
}
