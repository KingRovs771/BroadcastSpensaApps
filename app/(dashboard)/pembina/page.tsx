"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { DualGateBanner } from "@/components/modules/produksi/DualGateBanner";
import { TambahPembinaModal } from "@/components/modules/pembina/TambahPembinaModal";
import { AnggotaDetailModal } from "@/components/modules/anggota/AnggotaDetailModal";
import { EditAnggotaModal } from "@/components/modules/anggota/EditAnggotaModal";
import { HapusAnggotaModal } from "@/components/modules/anggota/HapusAnggotaModal";
import { UserDetailModal } from "@/components/modules/users/UserDetailModal";
import { ResetPasswordModal } from "@/components/modules/users/ResetPasswordModal";
import { AnggotaRecord, UserProfile } from "@/lib/mock/store";
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
  Users,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Phone,
  Plus,
  Key,
} from "lucide-react";

export default function PembinaDashboardPage() {
  const {
    currentUser,
    pembinaList,
    allUsers,
    anggotaList,
    produksiList,
    keuanganPembinaList,
    kasPembayaranList,
    absensiList,
    auditLogs,
  } = useSession();

  const [activeUserSection, setActiveUserSection] = useState<"pembina" | "users" | "anggota">("pembina");
  const [isTambahPembinaOpen, setIsTambahPembinaOpen] = useState(false);
  const [anggotaSearchQuery, setAnggotaSearchQuery] = useState("");
  const [anggotaTipeFilter, setAnggotaTipeFilter] = useState<"all" | "tetap" | "ekskul">("all");

  const [selectedDetailAnggota, setSelectedDetailAnggota] = useState<AnggotaRecord | null>(null);
  const [selectedEditAnggota, setSelectedEditAnggota] = useState<AnggotaRecord | null>(null);
  const [selectedDeleteAnggota, setSelectedDeleteAnggota] = useState<AnggotaRecord | null>(null);

  // User detail & reset password modals
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserProfile | null>(null);
  const [selectedResetUser, setSelectedResetUser] = useState<UserProfile | null>(null);

  const currentAcademic = getAcademicSemester(new Date());
  const kasSummary = calculateKasSummary(kasPembayaranList);

  const filteredAnggotaList = anggotaList
    .filter((a) => {
      if (anggotaTipeFilter === "all") return true;
      return a.tipe === anggotaTipeFilter;
    })
    .filter(
      (a) =>
        a.nama_lengkap.toLowerCase().includes(anggotaSearchQuery.toLowerCase()) ||
        a.nis.includes(anggotaSearchQuery) ||
        a.kelas.toLowerCase().includes(anggotaSearchQuery.toLowerCase()) ||
        a.jabatan.toLowerCase().includes(anggotaSearchQuery.toLowerCase())
    );

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

      {/* Dewan Pembina & Manajemen Pengguna Section */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-studio-border-subtle">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orbital-magenta" />
              Dewan Pembina &amp; Pengguna Sistem Broadcast Spensa
            </h3>
            <p className="text-[11px] text-studio-text-secondary mt-0.5">
              Guru pembina resmi, administrator pengawas, dan seluruh akun terdaftar di sistem.
            </p>
          </div>
          {(currentUser.role === "administrator" || currentUser.role === "pembina") && (
            <button
              onClick={() => setIsTambahPembinaOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/40 flex items-center gap-2 self-start sm:self-auto min-h-[44px]"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Tambah Pengguna / Pembina</span>
            </button>
          )}
        </div>

        {/* Sub-tab selection: Dewan Pembina vs Semua Pengguna vs Anggota Ekstrakurikuler */}
        <div className="flex items-center gap-2 border-b border-studio-border-subtle pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveUserSection("pembina")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeUserSection === "pembina"
                ? "bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/40"
                : "text-studio-text-secondary hover:text-white"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Dewan Pembina &amp; Pengawas ({pembinaList.length})</span>
          </button>
          <button
            onClick={() => setActiveUserSection("users")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeUserSection === "users"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "text-studio-text-secondary hover:text-white"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Semua Akun Pengguna ({(allUsers || []).length})</span>
          </button>
          <button
            onClick={() => setActiveUserSection("anggota")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeUserSection === "anggota"
                ? "bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/40 font-bold"
                : "text-studio-text-secondary hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Buku Induk Anggota ({anggotaList.length})</span>
          </button>
        </div>

        {activeUserSection === "pembina" ? (
          pembinaList.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl bg-surface-2/60 border border-studio-border-subtle border-dashed">
              <div className="w-12 h-12 rounded-full bg-violet-500/10 text-violet-400 mx-auto flex items-center justify-center mb-2.5">
                <GraduationCap className="w-6 h-6" />
              </div>
              <p className="text-xs font-semibold text-white">Belum Ada Dewan Pembina Terdaftar</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto mt-1">
                Klik tombol &quot;+ Tambah Pengguna / Pembina&quot; di atas untuk mendaftarkan guru pembina baru ke sistem.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pembinaList.map((p) => {
                const isAdmin = p.role === "administrator";
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl bg-surface-2 border transition-colors flex items-start gap-3 relative overflow-hidden group ${
                      isAdmin ? "border-rose-500/30 hover:border-rose-500/50" : "border-studio-border-subtle hover:border-violet-500/40"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isAdmin
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-gradient-to-br from-violet-600/30 to-pink-600/30 border border-violet-500/30 text-violet-300"
                    }`}>
                      {p.nama ? p.nama.charAt(0).toUpperCase() : "P"}
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white truncate block">
                          {p.nama}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold border ${
                          isAdmin
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            : "bg-orbital-violet/25 text-orbital-magenta border-orbital-violet/40"
                        }`}>
                          {isAdmin ? "ADMINISTRATOR / PENGAWAS" : "DEWAN PEMBINA"}
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
                );
              })}
            </div>
          )
        ) : activeUserSection === "users" ? (
          /* ── Content: Semua Pengguna Terdaftar (Users) View ── */
          (allUsers || []).length === 0 ? (
            <div className="text-center py-8 px-4 rounded-xl bg-surface-2/60 border border-studio-border-subtle border-dashed">
              <p className="text-xs font-semibold text-white">Belum Ada Akun Pengguna di Database</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-studio-text-secondary px-1">
                <span>Total <strong>{(allUsers || []).length}</strong> akun pengguna terdaftar di Supabase</span>
                <Link href="/anggota" className="text-spectrum-cyan hover:underline font-mono text-[11px] flex items-center gap-1">
                  <span>Buku Induk Lengkap</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(allUsers || []).map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-xl bg-surface-2 border transition-all space-y-2 relative ${
                        isSelf ? "border-spectrum-cyan/50 shadow-cyan" : "border-studio-border-subtle hover:border-studio-border-medium"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-white/10 text-white border border-white/15 uppercase">
                          {u.role.replace(/_/g, " ")}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          AKTIF
                        </span>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 border border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {u.nama ? u.nama.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-white truncate">{u.nama}</h4>
                            {isSelf && (
                              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/40">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                            {u.email}
                          </p>
                        </div>
                      </div>

                      {u.divisi && (
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-studio-border-subtle flex justify-between">
                          <span>Divisi:</span>
                          <span className="text-spectrum-cyan font-mono">{u.divisi}</span>
                        </div>
                      )}

                      {/* Baris Aksi Pengguna */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-studio-border-subtle">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailUser(u)}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-3 text-slate-200 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-studio-border-subtle min-h-[36px]"
                        >
                          <Eye className="w-3 h-3 text-spectrum-cyan" />
                          <span>Detail</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedResetUser(u)}
                          title="Reset Kata Sandi Akun"
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors border border-amber-500/25 min-h-[36px]"
                        >
                          <Key className="w-3 h-3 text-amber-400" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          /* ── Content: Buku Induk Anggota (CRUD Pembina & Administrator) ── */
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={anggotaSearchQuery}
                    onChange={(e) => setAnggotaSearchQuery(e.target.value)}
                    placeholder="Cari siswa, NIS, kelas, atau jabatan..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white placeholder:text-slate-500 focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
                  />
                </div>

                <select
                  value={anggotaTipeFilter}
                  onChange={(e) => setAnggotaTipeFilter(e.target.value as "all" | "tetap" | "ekskul")}
                  className="px-2.5 py-2 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
                >
                  <option value="all" className="bg-surface-2">Semua Tipe</option>
                  <option value="tetap" className="bg-surface-2">Anggota Tetap</option>
                  <option value="ekskul" className="bg-surface-2">Anggota Ekskul</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTambahPembinaOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan flex items-center gap-1.5 min-h-[40px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Siswa / Akun</span>
                </button>
                <Link
                  href="/anggota"
                  className="px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-300 hover:text-white text-xs font-semibold border border-studio-border-subtle flex items-center gap-1.5 transition-all min-h-[40px]"
                >
                  <span>Buku Induk Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {filteredAnggotaList.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl bg-surface-2/60 border border-studio-border-subtle border-dashed">
                <p className="text-xs font-semibold text-white">Tidak ada data anggota yang sesuai pencarian</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredAnggotaList.map((ang) => (
                  <div
                    key={ang.id}
                    className="p-4 rounded-xl bg-surface-2 border border-studio-border-subtle hover:border-studio-border-medium transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-1 text-white border border-studio-border-subtle">
                        NIS: {ang.nis}
                      </span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`px-2 py-0.2 rounded text-[9px] font-mono font-bold uppercase ${
                            ang.tipe === "tetap"
                              ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                              : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                          }`}
                        >
                          {ang.tipe}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-bold uppercase border ${
                            ang.status === "aktif"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {ang.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{ang.nama_lengkap}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Kelas {ang.kelas} · {ang.jabatan}
                      </p>
                      {ang.divisi && (
                        <p className="text-[10px] text-spectrum-cyan font-mono mt-0.5">
                          Divisi {ang.divisi}
                        </p>
                      )}
                    </div>

                    {/* Action buttons for Pembina & Administrator CRUD */}
                    <div className="flex items-center gap-1.5 pt-2 border-t border-studio-border-subtle">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailAnggota(ang)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-surface-1 hover:bg-surface-3 text-slate-200 hover:text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-all border border-studio-border-subtle hover:border-spectrum-cyan/40 min-h-[34px]"
                      >
                        <Eye className="w-3 h-3 text-spectrum-cyan" />
                        <span>Detail</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedEditAnggota(ang)}
                        title="Edit Data Anggota"
                        className="p-1.5 rounded-lg bg-surface-1 hover:bg-surface-3 text-slate-300 hover:text-white transition-all border border-studio-border-subtle hover:border-studio-border-medium min-h-[34px] min-w-[34px] flex items-center justify-center"
                      >
                        <Edit className="w-3 h-3 text-spectrum-cyan" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedDeleteAnggota(ang)}
                        title="Hapus Anggota"
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/25 hover:border-rose-500/40 min-h-[34px] min-w-[34px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

      {/* Modal Detail Anggota */}
      <AnggotaDetailModal
        isOpen={!!selectedDetailAnggota}
        onClose={() => setSelectedDetailAnggota(null)}
        anggota={selectedDetailAnggota}
        onEdit={(ang) => setSelectedEditAnggota(ang)}
        onDelete={(ang) => setSelectedDeleteAnggota(ang)}
      />

      {/* Modal Edit Anggota */}
      <EditAnggotaModal
        isOpen={!!selectedEditAnggota}
        onClose={() => setSelectedEditAnggota(null)}
        anggota={selectedEditAnggota}
      />

      {/* Modal Hapus Anggota */}
      <HapusAnggotaModal
        isOpen={!!selectedDeleteAnggota}
        onClose={() => setSelectedDeleteAnggota(null)}
        anggota={selectedDeleteAnggota}
      />

      {/* Modal Detail Pengguna */}
      <UserDetailModal
        isOpen={!!selectedDetailUser}
        onClose={() => setSelectedDetailUser(null)}
        user={selectedDetailUser}
        onResetPassword={(u) => {
          setSelectedDetailUser(null);
          setSelectedResetUser(u);
        }}
      />

      {/* Modal Reset Password Pengguna */}
      <ResetPasswordModal
        isOpen={!!selectedResetUser}
        onClose={() => setSelectedResetUser(null)}
        user={selectedResetUser}
      />
    </div>
  );
}

