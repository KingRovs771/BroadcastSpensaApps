"use client";

import React from "react";
import { useSession } from "@/components/shared/SessionContext";
import { getAcademicSemester } from "@/lib/utils/semester";
import { formatIDR } from "@/lib/utils/currency";
import { calculateKasSummary } from "@/lib/utils/kas-calc";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import {
  Video,
  Wallet,
  CalendarCheck,
  Kanban,
  FileText,
  Lock,
  Camera,
  Archive,
  Users,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

export default function DashboardHomePage() {
  const {
    currentUser,
    produksiList,
    kasPembayaranList,
    absensiList,
    projectList,
    inventarisList,
  } = useSession();

  const currentAcademic = getAcademicSemester(new Date());
  const kasSummary = calculateKasSummary(kasPembayaranList);
  const totalViews = produksiList.reduce((sum, p) => sum + p.jumlah_views, 0);

  const pendingDualGate = produksiList.filter(
    (p) =>
      p.status === "pending_approval" ||
      p.status === "pending_pembina" ||
      p.status === "pending_ketua"
  );

  const activeProjects = projectList.filter(
    (p) => p.status === "perencanaan" || p.status === "proses"
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-2xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-orbital-violet/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/30">
                ROLE: {currentUser.role.replace("_", " ")} {currentUser.divisi ? `· ${currentUser.divisi}` : ""}
              </span>
              <span className="text-[11px] font-mono text-studio-text-secondary">
                {currentAcademic.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white font-serif tracking-wide mt-1">
              Halo, {currentUser.nama}!
            </h1>
            <p className="text-xs text-studio-text-secondary mt-0.5 max-w-xl">
              Selamat datang di Unified Workspace Broadcast Spensa OS. Kelola produksi media, sirkulasi aset, dan presensi secara terpadu.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === "pembina" && (
              <Link
                href="/pembina"
                className="px-4 py-2 rounded-xl bg-orbital-violet hover:bg-orbital-magenta text-ink text-xs font-bold transition-all shadow-orbital flex items-center gap-2 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4" />
                <span>Monitoring Center</span>
              </Link>
            )}
            <Link
              href="/produksi"
              className="px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan flex items-center gap-2 min-h-[44px]"
            >
              <Video className="w-4 h-4" />
              <span>Lihat Pipeline Produksi</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Spectrum Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-spectrum-amber/10 rounded-full blur-xl" />
          <p className="text-[10px] font-mono font-bold text-spectrum-amber uppercase">
            Pending Dual-Gate
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {pendingDualGate.length} Naskah
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Butuh keputusan kurasi
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-spectrum-cyan/10 rounded-full blur-xl" />
          <p className="text-[10px] font-mono font-bold text-spectrum-cyan uppercase">
            Project Aktif
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {activeProjects.length} Agenda
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Dalam proses kanban
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-spectrum-jade/10 rounded-full blur-xl" />
          <p className="text-[10px] font-mono font-bold text-spectrum-jade uppercase">
            Kas Terkumpul
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(kasSummary.totalTerkumpul)}
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Piutang: {formatIDR(kasSummary.totalTertunggak)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-orbital-violet/10 rounded-full blur-xl" />
          <p className="text-[10px] font-mono font-bold text-orbital-magenta uppercase">
            Penonton Media
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {totalViews.toLocaleString()} Views
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Formula semester aktif
          </p>
        </div>
      </div>

      {/* Quick Launchpad & Operational Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline & Active Projects */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Pipeline Preview */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
              <h2 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
                <Video className="w-4 h-4 text-spectrum-cyan" />
                Pipeline Produksi Terkini
              </h2>
              <Link
                href="/produksi"
                className="text-xs font-mono text-spectrum-cyan hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {produksiList.slice(0, 3).map((prod) => (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-xl bg-surface-2 border border-studio-border-subtle flex items-center justify-between gap-3"
                >
                  <div className="space-y-1 max-w-md">
                    <span className="text-[10px] font-mono text-studio-text-muted">
                      Divisi {prod.divisi} · {prod.jenis.toUpperCase()}
                    </span>
                    <h3 className="text-xs font-bold text-white truncate">
                      {prod.judul}
                    </h3>
                  </div>

                  <StatusBadge
                    label={prod.status.replace("_", " ")}
                    variant={
                      prod.status === "published"
                        ? "jade"
                        : prod.status === "in_production"
                        ? "mandarin"
                        : "amber"
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Active Projects Kanban Preview */}
          <div className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
              <h2 className="text-xs font-mono font-bold uppercase text-white tracking-wider flex items-center gap-2">
                <Kanban className="w-4 h-4 text-spectrum-amber" />
                Agenda Project Kanban
              </h2>
              <Link
                href="/project"
                className="text-xs font-mono text-spectrum-cyan hover:underline flex items-center gap-1"
              >
                <span>Buka Board</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {projectList.slice(0, 3).map((project) => (
                <div
                  key={project.id}
                  className="p-3.5 rounded-xl bg-surface-2 border border-studio-border-subtle flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white">
                      {project.nama_project}
                    </h3>
                    <p className="text-[10px] font-mono text-studio-text-secondary">
                      PJ: {project.pj_name} · Divisi {project.divisi}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-surface-1 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-spectrum-cyan h-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-bold text-white">
                      {project.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Launchpad */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-3">
            <h2 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
              Akses Cepat Modul
            </h2>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <Link
                href="/kas"
                className="p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle flex items-center gap-3 transition-colors"
              >
                <Wallet className="w-4 h-4 text-spectrum-jade" />
                <div>
                  <p className="font-bold text-white">Buku Kas & Iuran</p>
                  <p className="text-[10px] text-studio-text-muted">Checkbox mingguan & tunggakan</p>
                </div>
              </Link>

              <Link
                href="/absensi"
                className="p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle flex items-center gap-3 transition-colors"
              >
                <CalendarCheck className="w-4 h-4 text-spectrum-cyan" />
                <div>
                  <p className="font-bold text-white">Absensi Presensi</p>
                  <p className="text-[10px] text-studio-text-muted">Anggota tetap & ekskul</p>
                </div>
              </Link>

              <Link
                href="/notulen"
                className="p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle flex items-center gap-3 transition-colors"
              >
                <FileText className="w-4 h-4 text-spectrum-gold" />
                <div>
                  <p className="font-bold text-white">Notulen Rapat</p>
                  <p className="text-[10px] text-studio-text-muted">Risalah & pengesahan digital</p>
                </div>
              </Link>

              <Link
                href="/inventaris"
                className="p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle flex items-center gap-3 transition-colors"
              >
                <Archive className="w-4 h-4 text-orbital-magenta" />
                <div>
                  <p className="font-bold text-white">Inventaris Aset</p>
                  <p className="text-[10px] text-studio-text-muted">Tagging BRC & sirkulasi pinjam</p>
                </div>
              </Link>

              <Link
                href="/laporan"
                className="p-3 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle flex items-center gap-3 transition-colors"
              >
                <Printer className="w-4 h-4 text-spectrum-cobalt" />
                <div>
                  <p className="font-bold text-white">Laporan Semester</p>
                  <p className="text-[10px] text-studio-text-muted">Kop surat dinas & 3-TTD</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
