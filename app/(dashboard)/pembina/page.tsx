"use client";

import React from "react";
import { useSession } from "@/components/shared/SessionContext";
import { DualGateBanner } from "@/components/modules/produksi/DualGateBanner";
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
} from "lucide-react";

export default function PembinaDashboardPage() {
  const {
    currentUser,
    produksiList,
    keuanganPembinaList,
    kasPembayaranList,
    absensiList,
    auditLogs,
  } = useSession();

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
    </div>
  );
}

