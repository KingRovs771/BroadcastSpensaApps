"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { KopSuratSpensa } from "@/components/modules/laporan/KopSuratSpensa";
import { getAcademicSemester } from "@/lib/utils/semester";
import { formatIDR } from "@/lib/utils/currency";
import { calculateKasSummary } from "@/lib/utils/kas-calc";
import {
  Printer,
  FileCheck2,
  Download,
  Calendar,
  Eye,
  Wallet,
  Users,
  Archive,
  CheckSquare,
} from "lucide-react";

export default function LaporanSemesterPage() {
  const {
    currentUser,
    anggotaList,
    kasPembayaranList,
    absensiList,
    produksiList,
    inventarisList,
  } = useSession();

  const [withSignature, setWithSignature] = useState(true);
  
  // Dynamic Semester Period Selection
  const defaultAcademic = getAcademicSemester(new Date());
  const [selectedSemester, setSelectedSemester] = useState<'ganjil' | 'genap'>(defaultAcademic.semester);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState<string>(defaultAcademic.tahunAjaran);

  const activeSemesterLabel = `Semester ${selectedSemester === 'ganjil' ? 'Ganjil' : 'Genap'} ${selectedTahunAjaran}`;

  const kasSummary = calculateKasSummary(kasPembayaranList);

  // Calculate attendance ratio
  const activeAbsensi = absensiList.filter((a) => !a.is_libur);
  const totalHadir = activeAbsensi.filter((a) => a.status === "masuk").length;
  const attendanceRate =
    activeAbsensi.length > 0 ? Math.round((totalHadir / activeAbsensi.length) * 100) : 100;

  // Calculate total publication views
  const totalViews = produksiList.reduce((sum, p) => sum + p.jumlah_views, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Screen Controls (Hidden on Print) */}
      <div className="print:hidden flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-surface-1 p-4 rounded-2xl border border-studio-border-subtle">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-spectrum-cobalt" />
            Generator Laporan Semester Terpadu
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Penyusunan dokumen pertanggungjawaban resmi dengan infografis, kop dinas, dan lembar tanda tangan 3-kolom.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Semester & Tahun Ajaran Selector */}
          <div className="flex items-center gap-2 bg-surface-2 p-1.5 rounded-xl border border-studio-border-subtle">
            <Calendar className="w-4 h-4 text-spectrum-cyan ml-1.5 shrink-0" />
            <select
              aria-label="Pilih Semester"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value as 'ganjil' | 'genap')}
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

          {/* Dual-Mode Signing Switcher */}
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

      {/* Official Printable Document Container */}
      <div className="printable-document bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl max-w-4xl mx-auto border border-slate-200 font-sans print:p-0 print:border-none print:shadow-none">
        {/* Kop Surat Spensa */}
        <KopSuratSpensa />

        {/* Title */}
        <div className="text-center my-4 pb-2">
          <h2 className="text-base sm:text-lg font-serif font-bold tracking-wide uppercase text-blue-950">
            LAPORAN AKUNTABILITAS & CAPAIAN PROGRAM EKSTRAKURIKULER
          </h2>
          <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5">
            {activeSemesterLabel.toUpperCase()} · TAHUN AJARAN {selectedTahunAjaran}
          </p>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
            I. RANGKUMAN EKSEKUTIF KINERJA OPERASIONAL
          </h3>
          <p className="text-xs text-slate-700 leading-relaxed text-justify">
            Ekstrakurikuler Broadcast SMP Negeri 1 Spensa pada periode semester berjalan telah menjalankan seluruh agenda operasional yang mencakup kurasi pra-produksi media berstandar Dual-Gate, penerbitan konten video/podcast edukatif, pencatatan kas berkala, pemeliharaan sirkulasi aset studio, serta peliputan prestasi kejuaraan siswa.
          </p>

          {/* 4 Summary Stat Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-600 uppercase block">Total Anggota</span>
              <strong className="text-lg font-bold text-slate-900">{anggotaList.length} Siswa</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-600 uppercase block">Rasio Kehadiran</span>
              <strong className="text-lg font-bold text-emerald-700">{attendanceRate}%</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-600 uppercase block">Total Saldo Kas</span>
              <strong className="text-lg font-bold text-slate-900 font-mono">{formatIDR(kasSummary.totalTerkumpul)}</strong>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
              <span className="text-[10px] font-mono text-slate-600 uppercase block">Penonton Media</span>
              <strong className="text-lg font-bold text-blue-800 font-mono">{totalViews.toLocaleString()} Views</strong>
            </div>
          </div>
        </div>

        {/* Section 2: Produksi Media & Analytics */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
            II. DAFTAR PUBLIKASI KARYA & ANALITIK PENONTON
          </h3>
          <table className="w-full text-left text-xs border border-slate-300 border-collapse">
            <thead className="bg-slate-100 font-serif">
              <tr className="border-b border-slate-300">
                <th className="p-2 border-r border-slate-300">Judul Karya / Liputan</th>
                <th className="p-2 border-r border-slate-300">Divisi</th>
                <th className="p-2 border-r border-slate-300">Format</th>
                <th className="p-2 border-r border-slate-300">Status Kurasi</th>
                <th className="p-2 text-right">Views</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {produksiList.map((prod) => (
                <tr key={prod.id}>
                  <td className="p-2 border-r border-slate-300 font-medium">{prod.judul}</td>
                  <td className="p-2 border-r border-slate-300">{prod.divisi}</td>
                  <td className="p-2 border-r border-slate-300 uppercase font-mono text-[10px]">{prod.jenis}</td>
                  <td className="p-2 border-r border-slate-300 font-bold text-emerald-800">
                    {prod.status.toUpperCase()}
                  </td>
                  <td className="p-2 text-right font-mono font-bold">
                    {prod.jumlah_views > 0 ? prod.jumlah_views.toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: Akuntabilitas Kas */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
            III. LAPORAN REKAPITULASI KEUANGAN & KAS
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span>Total Iuran Terkumpul:</span>
                <strong className="font-mono text-emerald-800">{formatIDR(kasSummary.totalTerkumpul)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Transaksi Lunas:</span>
                <span className="font-mono">{kasSummary.jumlahTransaksiLunas} Kali</span>
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
              <div className="flex justify-between">
                <span>Total Tunggakan:</span>
                <strong className="font-mono text-red-700">{formatIDR(kasSummary.totalTertunggak)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Kewajiban Tertunda:</span>
                <span className="font-mono">{kasSummary.jumlahTransaksiTertunggak} Kali</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Sirkulasi Aset Inventaris */}
        <div className="my-6 space-y-3">
          <h3 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-800 border-b border-slate-300 pb-1">
            IV. RINGKASAN KONDISI INVENTARIS ASET STUDIO
          </h3>
          <p className="text-xs text-slate-700">
            Total {inventarisList.length} kategori aset terdaftar di bawah pengelolaan Divisi Broadcasting dengan kondisi prima dan siap digunakan untuk kebutuhan dokumentasi sekolah.
          </p>
        </div>

        {/* Formal 3-Column Signatures (Enabled in withSignature mode) */}
        {withSignature && (
          <div className="mt-12 pt-6 border-t border-slate-300 break-inside-avoid">
            <p className="text-right text-[11px] text-slate-600 mb-4 font-serif">
              Ditetapkan di Spensa, pada tanggal {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-2 text-center text-xs">
              {/* Left Column: Sekretaris */}
              <div className="flex flex-col justify-between min-h-[120px]">
                <p className="font-serif text-slate-700 font-semibold">Sekretaris Broadcast,</p>
                <div className="my-auto py-2">
                  <span className="text-[10px] font-mono text-slate-500">[Digital Verified]</span>
                </div>
                <div>
                  <p className="font-bold underline text-slate-900">Nabila Syakieb</p>
                  <p className="text-[10px] text-slate-600 font-mono">NIS. 89202</p>
                </div>
              </div>

              {/* Center Column: Ketua Umum Broadcast */}
              <div className="flex flex-col justify-between min-h-[120px]">
                <p className="font-serif text-slate-700 font-semibold">Ketua Umum Broadcast,</p>
                <div className="my-auto py-2">
                  <span className="text-[10px] font-mono text-slate-500">[Digital Verified]</span>
                </div>
                <div>
                  <p className="font-bold underline text-slate-900">Raditya Pratama</p>
                  <p className="text-[10px] text-slate-600 font-mono">NIS. 89201</p>
                </div>
              </div>

              {/* Right Column: Pembina Ekstrakurikuler */}
              <div className="flex flex-col justify-between min-h-[120px]">
                <p className="font-serif text-slate-700 font-semibold">Pembina Ekstrakurikuler,</p>
                <div className="my-auto py-2">
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">[Telah Disahkan]</span>
                </div>
                <div>
                  <p className="font-bold underline text-slate-900">Bpk. Haryanto, S.Pd</p>
                  <p className="text-[10px] text-slate-600 font-mono">NIP. 19820514 200801 1 007</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

