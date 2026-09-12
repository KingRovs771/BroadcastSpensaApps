"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { DualGateBanner } from "@/components/modules/produksi/DualGateBanner";
import { TambahPembinaModal } from "@/components/modules/pembina/TambahPembinaModal";
import { formatIDR } from "@/lib/utils/currency";
import { calculateKasSummary } from "@/lib/utils/kas-calc";
import { getAcademicSemester } from "@/lib/utils/semester";
import Link from "next/link";
import {
  ShieldCheck,
  Video,
  Wallet,
  CalendarCheck,
  Lock,
  Clock,
  ArrowRight,
  Sparkles,
  FileCheck,
  UserPlus,
  GraduationCap,
  Mail,
} from "lucide-react";

export default function PembinaDashboardPage() {
  const {
    currentUser,
    pembinaList,
    produksiList,
    keuanganPembinaList,
    kasPembayaranList,
    absensiList,
    auditLogs,
  } = useSession();

  const [isTambahPembinaOpen, setIsTambahPembinaOpen] = useState(false);

  const currentAcademic = getAcademicSemester(new Date());
  const kasSummary = calculateKasSummary(kasPembayaranList);

  // Pembina pending dual-gate items
  const pendingPembinaList = produksiList.filter(
    (p) =>
      (p.status === "pending_approval" || p.status === "pending_pembina") &&
      !p.approved_pembina_by
  );

  // Strategic fund calculations
  const totalBOS = keuanganPembinaList
    .filter((k) => k.sumber_dana === "BOS")
    .reduce((s, k) => s + k.pemasukan - k.pengeluaran, 0);

  const totalSponsor = keuanganPembinaList
    .filter((k) => k.sumber_dana === "Sponsor")
    .reduce((s, k) => s + k.pemasukan - k.pengeluaran, 0);

  return (
    <div className="space-y-6">
      {/* Executive Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 border border-studio-border-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-orbital-violet/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/30">
                MONITORING CENTER PEMBINA
              </span>
              <span className="text-[11px] font-mono text-studio-text-secondary">
                {currentAcademic.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-wide">
              Selamat Bertugas, {currentUser.nama}
            </h1>
            <p className="text-xs text-studio-text-secondary max-w-2xl">
              Pusat pengawasan kurasi naskah Gate 1, tata kelola dana strategis BOS, serta kepatuhan absensi dan kas studio.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/keuangan-pembina"
              className="px-4 py-2 rounded-xl bg-surface-3 hover:bg-surface-2 text-white text-xs font-bold border border-studio-border-subtle flex items-center gap-2 transition-colors min-h-[44px]"
            >
              <Lock className="w-4 h-4 text-orbital-magenta" />
              <span>Buku Kas Pembina</span>
            </Link>
            <Link
              href="/laporan"
              className="px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan flex items-center gap-2 min-h-[44px]"
            >
              <FileCheck className="w-4 h-4" />
              <span>Sahkan Laporan</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-amber uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Menunggu Persetujuan Anda
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {pendingPembinaList.length} Naskah
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Dual-Gate Tier-1
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-orbital-magenta uppercase flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" /> Alokasi Dana BOS
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(totalBOS)}
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Tersedia untuk operasional
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-jade uppercase flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5" /> Kas Iuran Anggota
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(kasSummary.totalTerkumpul)}
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Terkumpul dari siswa
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-cyan uppercase flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5" /> Total Produksi Media
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {produksiList.length} Judul
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Podcast & video kreatif
          </p>
        </div>
      </div>

      {/* Priority Action: Dual Gate Items Waiting for Pembina */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-spectrum-amber" />
            Naskah Menunggu Keputusan Pembina (Tier-1)
          </h2>
          <Link
            href="/produksi"
            className="text-xs font-mono text-spectrum-cyan hover:underline flex items-center gap-1"
          >
            <span>Semua Pipeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pendingPembinaList.length === 0 ? (
          <div className="p-6 rounded-2xl bg-surface-1 border border-studio-border-subtle text-center text-xs text-spectrum-jade font-semibold">
            ✓ Seluruh naskah masuk telah Anda evaluasi. Tidak ada antrean kurasi tertunda saat ini.
          </div>
        ) : (
          pendingPembinaList.map((item) => (
            <DualGateBanner key={item.id} item={item} onUpdate={() => {}} />
          ))
        )}
      </div>

      {/* Dewan Pembina Management Section */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-studio-border-subtle">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orbital-magenta" />
              Dewan Pembina Broadcast Spensa
            </h3>
            <p className="text-[11px] text-studio-text-secondary mt-0.5">
              Guru pembina resmi dengan hak otoritas supervisi dan approval naskah Gate 1.
            </p>
          </div>
          {(currentUser.role === "administrator" || currentUser.role === "pembina") && (
            <button
              onClick={() => setIsTambahPembinaOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2 self-start sm:self-auto min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Pembina</span>
            </button>
          )}
        </div>

        {pembinaList.length === 0 ? (
          <div className="text-center py-8 px-4 rounded-xl bg-surface-2/60 border border-studio-border-subtle border-dashed">
            <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center mb-2.5">
              <GraduationCap className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-white">Belum Ada Dewan Pembina Terdaftar</p>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
              Klik tombol &quot;+ Tambah Pembina&quot; di atas untuk mendaftarkan guru pembina baru ke sistem.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pembinaList.map((p) => (
              <div
                key={p.id}
                className="p-4 rounded-xl bg-surface-2 border border-studio-border-subtle hover:border-violet-500/40 transition-colors flex items-start gap-3 relative overflow-hidden group"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/30 to-pink-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold shrink-0">
                  {p.nama.charAt(0).toUpperCase()}
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-white truncate block">
                      {p.nama}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-orbital-violet/25 text-orbital-magenta border border-orbital-violet/40">
                      PEMBINA
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                    {p.email}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Akses Aktif
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audit Log Activity Stream */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-spectrum-jade" />
            Audit Log Aktivitas Sistem (Append-Only)
          </h3>
          <span className="text-[10px] font-mono text-studio-text-muted">
            Live Stream
          </span>
        </div>

        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-mono text-[10px] text-spectrum-cyan font-bold block">
                  [{log.action}] · {log.actor_name} ({log.actor_role})
                </span>
                <p className="text-white mt-0.5">{log.details || log.target_table}</p>
              </div>
              <span className="text-[10px] font-mono text-studio-text-muted whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Tambah Pembina */}
      <TambahPembinaModal
        isOpen={isTambahPembinaOpen}
        onClose={() => setIsTambahPembinaOpen(false)}
      />
    </div>
  );
}

