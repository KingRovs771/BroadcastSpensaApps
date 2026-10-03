"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { KopSuratSpensa } from "@/components/modules/laporan/KopSuratSpensa";
import { getAcademicSemester } from "@/lib/utils/semester";
import { formatIDR } from "@/lib/utils/currency";
import { calculateKasSummary } from "@/lib/utils/kas-calc";
import {
  Printer,
  Calendar,
} from "lucide-react";

// ── Palette untuk grafik (aman di print) ────────────────────────────────────
const BAR_COLORS = [
  "#1d4ed8", "#0891b2", "#059669", "#d97706", "#7c3aed",
  "#db2777", "#16a34a", "#ea580c", "#6d28d9", "#0369a1",
];
const PIE_INCOME_COLOR = "#15803d"; // hijau tua
const PIE_EXPENSE_COLOR = "#b91c1c"; // merah tua

// ── SVG Bar Chart (murni code, print-friendly) ───────────────────────────────
function BarChart({
  data,
  maxValue,
  width = 480,
  height = 120,
}: {
  data: { label: string; value: number; color: string }[];
  maxValue: number;
  width?: number;
  height?: number;
}) {
  if (data.length === 0) return null;
  const barAreaH = height - 28; // 28px for labels
  const barWidth = Math.max(14, Math.floor((width - 20) / data.length) - 6);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      style={{ maxWidth: width, display: "block", margin: "0 auto" }}
      aria-label="Grafik Bar Jumlah Views"
    >
      {/* Y gridlines */}
      {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
        const y = 4 + barAreaH * (1 - frac);
        return (
          <line
            key={frac}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="#cbd5e1"
            strokeWidth={0.5}
            strokeDasharray="3,2"
          />
        );
      })}

      {data.map((d, i) => {
        const ratio = maxValue > 0 ? d.value / maxValue : 0;
        const barH = Math.max(2, barAreaH * ratio);
        const x = 10 + i * ((width - 20) / data.length);
        const centerX = x + barWidth / 2;
        const y = 4 + barAreaH - barH;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={d.color}
              rx={2}
            />
            {/* value label on top of bar */}
            {d.value > 0 && (
              <text
                x={centerX}
                y={y - 2}
                textAnchor="middle"
                fontSize={7}
                fill="#1e293b"
                fontFamily="monospace"
              >
                {d.value.toLocaleString()}
              </text>
            )}
            {/* x-axis label */}
            <text
              x={centerX}
              y={height - 4}
              textAnchor="middle"
              fontSize={7}
              fill="#475569"
              fontFamily="sans-serif"
            >
              {d.label.length > 12 ? d.label.slice(0, 11) + "…" : d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG Pie Chart (murni code, print-friendly) ────────────────────────────────
function PieChart({
  income,
  expense,
  size = 120,
}: {
  income: number;
  expense: number;
  size?: number;
}) {
  const total = income + expense;
  if (total === 0)
    return (
      <p style={{ fontSize: 10, color: "#64748b", textAlign: "center" }}>
        Tidak ada data keuangan.
      </p>
    );

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  const incomeAngle = (income / total) * 2 * Math.PI;
  const x1 = cx + r * Math.cos(-Math.PI / 2);
  const y1 = cy + r * Math.sin(-Math.PI / 2);
  const x2 = cx + r * Math.cos(-Math.PI / 2 + incomeAngle);
  const y2 = cy + r * Math.sin(-Math.PI / 2 + incomeAngle);
  const largeArc = incomeAngle > Math.PI ? 1 : 0;

  const incomePct = Math.round((income / total) * 100);
  const expensePct = 100 - incomePct;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-label="Grafik Pie Keuangan Pembina"
        style={{ flexShrink: 0 }}
      >
        {expense === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill={PIE_INCOME_COLOR} />
        ) : income === 0 ? (
          <circle cx={cx} cy={cy} r={r} fill={PIE_EXPENSE_COLOR} />
        ) : (
          <>
            {/* Income slice */}
            <path
              d={`M ${cx},${cy} L ${x1},${y1} A ${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`}
              fill={PIE_INCOME_COLOR}
            />
            {/* Expense slice */}
            <path
              d={`M ${cx},${cy} L ${x2},${y2} A ${r},${r} 0 ${1 - largeArc} 1 ${x1},${y1} Z`}
              fill={PIE_EXPENSE_COLOR}
            />
          </>
        )}
      </svg>
      {/* Legend */}
      <div style={{ fontSize: 10, lineHeight: 1.8, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              background: PIE_INCOME_COLOR,
              borderRadius: 2,
            }}
          />
          <span style={{ color: "#15803d", fontWeight: 700 }}>
            Pemasukan {incomePct}% ({formatIDR(income)})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              background: PIE_EXPENSE_COLOR,
              borderRadius: 2,
            }}
          />
          <span style={{ color: "#b91c1c", fontWeight: 700 }}>
            Pengeluaran {expensePct}% ({formatIDR(expense)})
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LaporanSemesterPage() {
  const {
    currentUser,
    anggotaList,
    kasPembayaranList,
    absensiList,
    produksiList,
    inventarisList,
    keuanganPembinaList,
    allUsers,
  } = useSession();

  const [withSignature, setWithSignature] = useState(true);

  // ── Semester Period Selection ──────────────────────────────────────────────
  const defaultAcademic = getAcademicSemester(new Date());
  const [selectedSemester, setSelectedSemester] = useState<"ganjil" | "genap">(
    defaultAcademic.semester
  );
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(
    defaultAcademic.tahunAjaran
  );
  const activeSemesterLabel = `Semester ${
    selectedSemester === "ganjil" ? "Ganjil" : "Genap"
  } ${selectedTahunAjaran}`;

  // ── Kas Summary ───────────────────────────────────────────────────────────
  const kasSummary = calculateKasSummary(kasPembayaranList);

  // ── Attendance ────────────────────────────────────────────────────────────
  const activeAbsensi = absensiList.filter((a) => !a.is_libur);
  const totalHadir = activeAbsensi.filter((a) => a.status === "masuk").length;
  const attendanceRate =
    activeAbsensi.length > 0
      ? Math.round((totalHadir / activeAbsensi.length) * 100)
      : 100;

  // ── Produksi Views (Bar Chart data) ─────────────────────────────────────
  const produksiWithViews = produksiList.filter((p) => p.jumlah_views > 0);
  const maxViews =
    produksiWithViews.length > 0
      ? Math.max(...produksiWithViews.map((p) => p.jumlah_views))
      : 1;
  const totalViews = produksiList.reduce((sum, p) => sum + p.jumlah_views, 0);

  const barChartData = produksiWithViews.map((p, i) => ({
    label: p.judul,
    value: p.jumlah_views,
    color: BAR_COLORS[i % BAR_COLORS.length],
  }));

  // ── Keuangan Pembina (Pie Chart) ──────────────────────────────────────────
  const totalPemasukan = keuanganPembinaList.reduce(
    (sum, k) => sum + (k.pemasukan || 0),
    0
  );
  const totalPengeluaran = keuanganPembinaList.reduce(
    (sum, k) => sum + (k.pengeluaran || 0),
    0
  );
  // Detail pengeluaran per keterangan
  const pengeluaranDetails = useMemo(() => {
    const map = new Map<string, number>();
    keuanganPembinaList.forEach((k) => {
      if (k.pengeluaran > 0) {
        const key = k.keterangan || "Lainnya";
        map.set(key, (map.get(key) || 0) + k.pengeluaran);
      }
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [keuanganPembinaList]);

  // ── Kas Anggota — belum bayar (≥ 2 orang) ────────────────────────────────
  const anggotaBelumBayar = useMemo(() => {
    const belumSet = new Map<string, { nama: string; tunggakan: number }>();
    kasPembayaranList
      .filter((k) => k.status === "belum")
      .forEach((k) => {
        const anggota = anggotaList.find((a) => a.id === k.anggota_id);
        if (!anggota) return;
        const existing = belumSet.get(k.anggota_id);
        if (existing) {
          existing.tunggakan += k.nominal;
        } else {
          belumSet.set(k.anggota_id, {
            nama: anggota.nama_lengkap,
            tunggakan: k.nominal,
          });
        }
      });
    return Array.from(belumSet.values()).sort((a, b) =>
      a.nama.localeCompare(b.nama)
    );
  }, [kasPembayaranList, anggotaList]);
  const showKasBelumBayar = anggotaBelumBayar.length >= 2;

  // ── Penanda Tangan Dinamis (dari allUsers) ────────────────────────────────
  const sekretarisUser = allUsers.find((u) => u.role === "sekretaris");
  const ketuaUser = allUsers.find((u) => u.role === "ketua_broadcast");
  const pembinaUser = allUsers.find(
    (u) => u.role === "pembina" || u.role === "administrator"
  );

  const getAnggotaByUserId = (userId?: string) =>
    anggotaList.find((a) => a.user_id === userId || a.id === userId);

  const sekretarisAnggota = getAnggotaByUserId(sekretarisUser?.id);
  const ketuaAnggota = getAnggotaByUserId(ketuaUser?.id);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      {/* ── Screen Controls (Hidden on Print) ─────────────────────────────── */}
      <div className="print:hidden flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-1 p-4 rounded-2xl border border-studio-border-subtle">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-spectrum-cobalt" />
            Generator Laporan Semester Terpadu
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Dokumen pertanggungjawaban resmi dengan infografis, kop dinas, dan
            lembar tanda tangan 3-kolom.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Semester & Tahun Selector */}
          <div className="flex items-center gap-2 bg-surface-2 p-1.5 rounded-xl border border-studio-border-subtle">
            <Calendar className="w-4 h-4 text-spectrum-cyan ml-1.5 shrink-0" />
            <select
              aria-label="Pilih Semester"
              value={selectedSemester}
              onChange={(e) =>
                setSelectedSemester(e.target.value as "ganjil" | "genap")
              }
              className="bg-surface-3 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-studio-border-subtle focus:outline-none focus:border-spectrum-cyan"
            >
              <option value="ganjil">Semester Ganjil</option>
              <option value="genap">Semester Genap</option>
            </select>
            <select
              aria-label="Pilih Tahun Ajaran"
              value={selectedTahunAjaran}
              onChange={(e) => setSelectedTahunAjaran(e.target.value)}
              className="bg-surface-3 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-studio-border-subtle focus:outline-none focus:border-spectrum-cyan"
            >
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
              <option value="2027/2028">2027/2028</option>
            </select>
          </div>

          {/* Signature Mode */}
          <div className="flex items-center gap-2 bg-surface-2 p-1.5 rounded-xl border border-studio-border-subtle">
            <button
              onClick={() => setWithSignature(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                !withSignature
                  ? "bg-spectrum-cyan text-cosmic font-extrabold"
                  : "text-studio-text-secondary hover:text-white"
              }`}
            >
              Mode Digital
            </button>
            <button
              onClick={() => setWithSignature(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                withSignature
                  ? "bg-orbital-violet text-ink font-extrabold shadow-orbital"
                  : "text-studio-text-secondary hover:text-white"
              }`}
            >
              Mode Cetak (3-TTD)
            </button>
          </div>

          <button
            onClick={handlePrint}
            aria-label="Cetak atau Simpan Laporan ke PDF"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Unduh PDF</span>
          </button>
        </div>
      </div>

      {/* ── Printable Document A4 ─────────────────────────────────────────── */}
      <div className="printable-document bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto border border-slate-200 font-sans print:p-0 print:border-none print:shadow-none">
        {/* Kop Surat */}
        <KopSuratSpensa />

        {/* Judul Laporan */}
        <div className="text-center my-4 pb-2">
          <h2
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: "14px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              color: "#172554",
              margin: 0,
            }}
          >
            LAPORAN AKUNTABILITAS &amp; CAPAIAN PROGRAM EKSTRAKURIKULER
          </h2>
          <p
            style={{
              fontFamily: "monospace",
              fontWeight: 600,
              fontSize: "11px",
              color: "#475569",
              marginTop: 4,
            }}
          >
            {activeSemesterLabel.toUpperCase()} &middot; TAHUN AJARAN{" "}
            {selectedTahunAjaran}
          </p>
        </div>

        {/* ── I. Rangkuman Eksekutif ─────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#1e293b",
              borderBottom: "1px solid #cbd5e1",
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            I. RANGKUMAN EKSEKUTIF KINERJA OPERASIONAL
          </h3>
          <p
            style={{
              fontSize: 11,
              color: "#374151",
              lineHeight: 1.7,
              textAlign: "justify",
              margin: "0 0 8px",
            }}
          >
            Ekstrakurikuler Broadcast Club SMP Negeri 1 Sragen pada{" "}
            {activeSemesterLabel} telah menjalankan seluruh agenda operasional
            yang mencakup kurasi pra-produksi media berstandar Dual-Gate,
            penerbitan konten video/podcast edukatif, pencatatan kas berkala,
            pemeliharaan sirkulasi aset studio, serta peliputan prestasi
            kejuaraan siswa.
          </p>

          {/* 4-box stat */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
            }}
          >
            {[
              {
                label: "Total Anggota",
                value: `${anggotaList.length} Siswa`,
                color: "#1e293b",
              },
              {
                label: "Rasio Kehadiran",
                value: `${attendanceRate}%`,
                color: "#15803d",
              },
              {
                label: "Total Kas Terkumpul",
                value: formatIDR(kasSummary.totalTerkumpul),
                color: "#1e293b",
              },
              {
                label: "Total Views Media",
                value: `${totalViews.toLocaleString()}`,
                color: "#1d4ed8",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                style={{
                  padding: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    display: "block",
                    fontSize: 9,
                    fontFamily: "monospace",
                    color: "#64748b",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </span>
                <strong
                  style={{
                    display: "block",
                    fontSize: 15,
                    color: stat.color,
                    fontFamily: "monospace",
                    marginTop: 2,
                  }}
                >
                  {stat.value}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* ── II. Produksi Media & Grafik Bar ───────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#1e293b",
              borderBottom: "1px solid #cbd5e1",
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            II. DAFTAR PUBLIKASI KARYA &amp; ANALITIK PENONTON
          </h3>

          {/* Bar Chart Views */}
          {barChartData.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <p
                style={{
                  fontSize: 10,
                  fontFamily: "serif",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Grafik Distribusi Jumlah Views per Karya:
              </p>
              <BarChart
                data={barChartData}
                maxValue={maxViews}
                width={520}
                height={130}
              />
            </div>
          )}

          <table
            style={{
              width: "100%",
              fontSize: 10,
              borderCollapse: "collapse",
              border: "1px solid #cbd5e1",
            }}
          >
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {[
                  "Judul Karya / Liputan",
                  "Divisi",
                  "Format",
                  "Status Kurasi",
                  "Views",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "5px 7px",
                      textAlign: "left",
                      border: "1px solid #cbd5e1",
                      fontFamily: "serif",
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {produksiList.map((prod) => (
                <tr key={prod.id}>
                  <td
                    style={{
                      padding: "4px 7px",
                      border: "1px solid #e2e8f0",
                      fontWeight: 500,
                    }}
                  >
                    {prod.judul}
                  </td>
                  <td
                    style={{ padding: "4px 7px", border: "1px solid #e2e8f0" }}
                  >
                    {prod.divisi}
                  </td>
                  <td
                    style={{
                      padding: "4px 7px",
                      border: "1px solid #e2e8f0",
                      textTransform: "uppercase",
                      fontFamily: "monospace",
                      fontSize: 9,
                    }}
                  >
                    {prod.jenis}
                  </td>
                  <td
                    style={{
                      padding: "4px 7px",
                      border: "1px solid #e2e8f0",
                      fontWeight: 700,
                      color: "#166534",
                    }}
                  >
                    {prod.status.toUpperCase()}
                  </td>
                  <td
                    style={{
                      padding: "4px 7px",
                      border: "1px solid #e2e8f0",
                      textAlign: "right",
                      fontFamily: "monospace",
                      fontWeight: 700,
                    }}
                  >
                    {prod.jumlah_views > 0
                      ? prod.jumlah_views.toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── III. Keuangan Pembina (Pie + Detail) ─────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#1e293b",
              borderBottom: "1px solid #cbd5e1",
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            III. LAPORAN KEUANGAN PEMBINA &amp; GRAFIK KOMPOSISI
          </h3>

          {/* Pie chart row */}
          <div
            style={{
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <PieChart
              income={totalPemasukan}
              expense={totalPengeluaran}
              size={110}
            />
            {/* Summary numbers */}
            <div
              style={{ fontSize: 10, lineHeight: 2, fontFamily: "sans-serif" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
                <span>Total Pemasukan:</span>
                <strong style={{ fontFamily: "monospace", color: "#15803d" }}>
                  {formatIDR(totalPemasukan)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 24 }}>
                <span>Total Pengeluaran:</span>
                <strong style={{ fontFamily: "monospace", color: "#b91c1c" }}>
                  {formatIDR(totalPengeluaran)}
                </strong>
              </div>
              <div
                style={{
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: 4,
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 24,
                }}
              >
                <span style={{ fontWeight: 700 }}>Saldo Bersih:</span>
                <strong
                  style={{
                    fontFamily: "monospace",
                    color:
                      totalPemasukan - totalPengeluaran >= 0
                        ? "#15803d"
                        : "#b91c1c",
                    fontSize: 12,
                  }}
                >
                  {formatIDR(totalPemasukan - totalPengeluaran)}
                </strong>
              </div>
            </div>
          </div>

          {/* Detail pengeluaran per keterangan */}
          {pengeluaranDetails.length > 0 && (
            <>
              <p
                style={{
                  fontSize: 10,
                  fontFamily: "serif",
                  fontWeight: 600,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Rincian Penggunaan Dana dalam Semester Ini:
              </p>
              <table
                style={{
                  width: "100%",
                  fontSize: 10,
                  borderCollapse: "collapse",
                  border: "1px solid #cbd5e1",
                }}
              >
                <thead>
                  <tr style={{ background: "#fef2f2" }}>
                    <th
                      style={{
                        padding: "4px 7px",
                        textAlign: "left",
                        border: "1px solid #fecaca",
                        fontFamily: "serif",
                        fontWeight: 700,
                      }}
                    >
                      Keterangan Penggunaan
                    </th>
                    <th
                      style={{
                        padding: "4px 7px",
                        textAlign: "right",
                        border: "1px solid #fecaca",
                        fontFamily: "serif",
                        fontWeight: 700,
                      }}
                    >
                      Jumlah Pengeluaran
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pengeluaranDetails.map(([ket, nominal]) => (
                    <tr key={ket}>
                      <td
                        style={{
                          padding: "3px 7px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {ket}
                      </td>
                      <td
                        style={{
                          padding: "3px 7px",
                          border: "1px solid #e2e8f0",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "#b91c1c",
                        }}
                      >
                        {formatIDR(nominal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ── IV. Kas Anggota ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#1e293b",
              borderBottom: "1px solid #cbd5e1",
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            IV. REKAPITULASI KAS ANGGOTA
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 10,
              fontSize: 10,
            }}
          >
            <div
              style={{
                padding: 8,
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Iuran Terkumpul:</span>
                <strong style={{ fontFamily: "monospace", color: "#15803d" }}>
                  {formatIDR(kasSummary.totalTerkumpul)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Transaksi Lunas:</span>
                <span style={{ fontFamily: "monospace" }}>
                  {kasSummary.jumlahTransaksiLunas} Kali
                </span>
              </div>
            </div>
            <div
              style={{
                padding: 8,
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 6,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Tunggakan:</span>
                <strong style={{ fontFamily: "monospace", color: "#b91c1c" }}>
                  {formatIDR(kasSummary.totalTertunggak)}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Kewajiban Tertunda:</span>
                <span style={{ fontFamily: "monospace" }}>
                  {kasSummary.jumlahTransaksiTertunggak} Kali
                </span>
              </div>
            </div>
          </div>

          {/* Daftar anggota belum bayar (hanya jika ≥ 2 orang) */}
          {showKasBelumBayar && (
            <>
              <p
                style={{
                  fontSize: 10,
                  fontFamily: "serif",
                  fontWeight: 600,
                  color: "#b91c1c",
                  marginBottom: 4,
                }}
              >
                Daftar Anggota dengan Tunggakan Kas (Belum Lunas):
              </p>
              <table
                style={{
                  width: "100%",
                  fontSize: 10,
                  borderCollapse: "collapse",
                  border: "1px solid #fecaca",
                }}
              >
                <thead>
                  <tr style={{ background: "#fef2f2" }}>
                    <th
                      style={{
                        padding: "4px 7px",
                        textAlign: "left",
                        border: "1px solid #fecaca",
                        fontFamily: "serif",
                        fontWeight: 700,
                      }}
                    >
                      No.
                    </th>
                    <th
                      style={{
                        padding: "4px 7px",
                        textAlign: "left",
                        border: "1px solid #fecaca",
                        fontFamily: "serif",
                        fontWeight: 700,
                      }}
                    >
                      Nama Anggota
                    </th>
                    <th
                      style={{
                        padding: "4px 7px",
                        textAlign: "right",
                        border: "1px solid #fecaca",
                        fontFamily: "serif",
                        fontWeight: 700,
                      }}
                    >
                      Total Tunggakan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {anggotaBelumBayar.map((a, i) => (
                    <tr key={a.nama}>
                      <td
                        style={{
                          padding: "3px 7px",
                          border: "1px solid #e2e8f0",
                          fontFamily: "monospace",
                        }}
                      >
                        {i + 1}.
                      </td>
                      <td
                        style={{
                          padding: "3px 7px",
                          border: "1px solid #e2e8f0",
                          fontWeight: 500,
                        }}
                      >
                        {a.nama}
                      </td>
                      <td
                        style={{
                          padding: "3px 7px",
                          border: "1px solid #e2e8f0",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: "#b91c1c",
                        }}
                      >
                        {formatIDR(a.tunggakan)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* ── V. Inventaris ─────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h3
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#1e293b",
              borderBottom: "1px solid #cbd5e1",
              paddingBottom: 4,
              marginBottom: 8,
            }}
          >
            V. RINGKASAN KONDISI INVENTARIS ASET STUDIO
          </h3>
          <p style={{ fontSize: 11, color: "#374151" }}>
            Total <strong>{inventarisList.length}</strong> item aset terdaftar
            di bawah pengelolaan Divisi Broadcasting dengan kondisi prima dan
            siap digunakan untuk kebutuhan dokumentasi sekolah.
          </p>
        </div>

        {/* ── Lembar Pengesahan 3-Kolom ─────────────────────────────────── */}
        {withSignature && (
          <div
            style={{
              marginTop: 40,
              paddingTop: 16,
              borderTop: "1px solid #cbd5e1",
              pageBreakInside: "avoid",
            }}
          >
            <p
              style={{
                textAlign: "right",
                fontSize: 11,
                color: "#475569",
                marginBottom: 16,
                fontFamily: "serif",
              }}
            >
              Ditetapkan di Sragen, pada tanggal{" "}
              {new Date().toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
                textAlign: "center",
                fontSize: 11,
                fontFamily: "sans-serif",
              }}
            >
              {/* Kolom 1: Sekretaris */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 120,
                }}
              >
                <p style={{ fontFamily: "serif", fontWeight: 600, color: "#374151" }}>
                  Sekretaris Broadcast,
                </p>
                <div style={{ padding: "12px 0" }}>
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "#94a3b8" }}>
                    [Digital Verified]
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      textDecoration: "underline",
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {sekretarisUser?.nama ?? "___________________"}
                  </p>
                  {sekretarisAnggota?.nis && (
                    <p
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        color: "#475569",
                        margin: 0,
                      }}
                    >
                      NIS. {sekretarisAnggota.nis}
                    </p>
                  )}
                </div>
              </div>

              {/* Kolom 2: Ketua Broadcast */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 120,
                }}
              >
                <p style={{ fontFamily: "serif", fontWeight: 600, color: "#374151" }}>
                  Ketua Umum Broadcast,
                </p>
                <div style={{ padding: "12px 0" }}>
                  <span style={{ fontSize: 9, fontFamily: "monospace", color: "#94a3b8" }}>
                    [Digital Verified]
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      textDecoration: "underline",
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {ketuaUser?.nama ?? "___________________"}
                  </p>
                  {ketuaAnggota?.nis && (
                    <p
                      style={{
                        fontSize: 9,
                        fontFamily: "monospace",
                        color: "#475569",
                        margin: 0,
                      }}
                    >
                      NIS. {ketuaAnggota.nis}
                    </p>
                  )}
                </div>
              </div>

              {/* Kolom 3: Pembina */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: 120,
                }}
              >
                <p style={{ fontFamily: "serif", fontWeight: 600, color: "#374151" }}>
                  Pembina Ekstrakurikuler,
                </p>
                <div style={{ padding: "12px 0" }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      color: "#15803d",
                      fontWeight: 700,
                    }}
                  >
                    [Telah Disahkan]
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontWeight: 700,
                      textDecoration: "underline",
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {pembinaUser?.nama ?? "___________________"}
                  </p>
                  <p
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      color: "#475569",
                      margin: 0,
                    }}
                  >
                    Pembina Broadcast Club
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
