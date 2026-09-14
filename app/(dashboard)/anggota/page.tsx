"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { AnggotaRecord, DivisiName, UserProfile } from "@/lib/mock/store";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import { createClient } from "@/lib/supabase/client";
import { TambahPembinaModal } from "@/components/modules/pembina/TambahPembinaModal";
import { AnggotaDetailModal } from "@/components/modules/anggota/AnggotaDetailModal";
import { EditAnggotaModal } from "@/components/modules/anggota/EditAnggotaModal";
import { HapusAnggotaModal } from "@/components/modules/anggota/HapusAnggotaModal";
import { UserDetailModal } from "@/components/modules/users/UserDetailModal";
import { EditUserModal } from "@/components/modules/users/EditUserModal";
import { HapusUserModal } from "@/components/modules/users/HapusUserModal";
import { ResetPasswordModal } from "@/components/modules/users/ResetPasswordModal";
import { exportAnggotaToCSV } from "@/lib/utils/excel";
import {
  Users,
  Plus,
  Search,
  Award,
  Filter,
  X,
  Phone,
  GraduationCap,
  Mail,
  Shield,
  UserCheck,
  CheckCircle,
  Download,
  Eye,
  Edit,
  Trash2,
  Key,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Pilihan Dropdown ──────────────────────────────────────────────────────────
const TINGKAT_KELAS_OPTIONS = ["VII", "VIII", "IX"] as const;
const ROMBEL_OPTIONS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"
] as const;

const JABATAN_ROLE_OPTIONS = [
  "Anggota",
  "Ketua Umum Broadcast",
  "Wakil Ketua Broadcast",
  "Ketua Divisi",
  "Sekretaris 1",
  "Sekretaris 2",
  "Bendahara 1",
  "Bendahara 2",
  "Penanggung Jawab (PJ)",
  "Staf Divisi Kreatif",
  "Staf Teknis Studio",
] as const;

export default function AnggotaPage() {
  const supabase = createClient();
  const {
    currentUser,
    anggotaList,
    setAnggotaList,
    pembinaList,
    allUsers,
    logAction,
  } = useSession();

  const [activeTab, setActiveTab] = useState<"tetap" | "ekskul" | "pembina" | "users">("tetap");
  const [searchQuery, setSearchQuery] = useState("");
  const [kelasFilter, setKelasFilter] = useState<"all" | "VII" | "VIII" | "IX">("all");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPembinaModalOpen, setIsPembinaModalOpen] = useState(false);

  // Form states untuk Anggota
  const [namaLengkap, setNamaLengkap] = useState("");
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [tingkatKelas, setTingkatKelas] = useState<"VII" | "VIII" | "IX">("VIII");
  const [rombelKelas, setRombelKelas] = useState<string>("A");
  const [jabatan, setJabatan] = useState<string>("Anggota");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [noHp, setNoHp] = useState("");

  // Popup CRUD & Detail states
  const [selectedDetailAnggota, setSelectedDetailAnggota] = useState<AnggotaRecord | null>(null);
  const [selectedEditAnggota, setSelectedEditAnggota] = useState<AnggotaRecord | null>(null);
  const [selectedDeleteAnggota, setSelectedDeleteAnggota] = useState<AnggotaRecord | null>(null);

  // Popup Detail Pengguna, Edit, Reset Password & Hapus (Admin & Pembina)
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserProfile | null>(null);
  const [selectedResetUser, setSelectedResetUser] = useState<UserProfile | null>(null);
  const [selectedEditUser, setSelectedEditUser] = useState<UserProfile | null>(null);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<UserProfile | null>(null);

  const isSekretarisOrAdmin =
    currentUser.role === "sekretaris" || currentUser.role === "administrator";

  const isPembinaOrAdmin =
    currentUser.role === "pembina" || currentUser.role === "administrator";

  const canResetPassword = isPembinaOrAdmin;

  // Hak Akses Spesifik
  const canCreateAnggota = isPembinaOrAdmin || isSekretarisOrAdmin;
  const canViewDetail =
    isPembinaOrAdmin ||
    currentUser.role === "ketua_broadcast" ||
    currentUser.role === "ketua_divisi" ||
    currentUser.role === "sekretaris" ||
    currentUser.role === "bendahara";
  const canEditAnggota = isPembinaOrAdmin || currentUser.role === "sekretaris";
  const canDeleteAnggota = isPembinaOrAdmin;

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "administrator":
        return {
          label: "ADMINISTRATOR",
          className: "bg-rose-500/15 text-rose-400 border-rose-500/30",
        };
      case "pembina":
        return {
          label: "DEWAN PEMBINA",
          className: "bg-amber-500/15 text-amber-400 border-amber-500/30",
        };
      case "ketua_broadcast":
        return {
          label: "KETUA UMUM",
          className: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
        };
      case "ketua_divisi":
        return {
          label: "KETUA DIVISI",
          className: "bg-violet-500/15 text-violet-400 border-violet-500/30",
        };
      case "sekretaris":
        return {
          label: "SEKRETARIS",
          className: "bg-sky-500/15 text-sky-400 border-sky-500/30",
        };
      case "bendahara":
        return {
          label: "BENDAHARA",
          className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
        };
      case "div_kreatif":
        return {
          label: "DIVISI KREATIF",
          className: "bg-pink-500/15 text-pink-400 border-pink-500/30",
        };
      case "pj":
        return {
          label: "PENANGGUNG JAWAB",
          className: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
        };
      default:
        return {
          label: "ANGGOTA",
          className: "bg-slate-500/15 text-slate-300 border-slate-500/30",
        };
    }
  };

  // Filter anggota berdasarkan tab, kelas, & search
  const filteredMembers = anggotaList
    .filter((a) => a.tipe === activeTab)
    .filter((a) => {
      if (kelasFilter === "all") return true;
      return a.kelas.startsWith(kelasFilter);
    })
    .filter((a) =>
      a.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nis.includes(searchQuery) ||
      a.kelas.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.jabatan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.divisi && a.divisi.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  // Filter pembina
  const filteredPembina = pembinaList.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter semua pengguna (termasuk filter khusus Ketua Divisi & Master Roles)
  const filteredUsers = (allUsers || []).filter((u) => {
    // 1. Role Filter
    if (userRoleFilter !== "all") {
      if (userRoleFilter === "ketua_divisi" && u.role !== "ketua_divisi") return false;
      if (userRoleFilter === "pembina_admin" && u.role !== "pembina" && u.role !== "administrator") return false;
      if (userRoleFilter === "pengurus" && !["ketua_broadcast", "sekretaris", "bendahara"].includes(u.role)) return false;
      if (userRoleFilter === "kreatif_pj" && !["div_kreatif", "pj"].includes(u.role)) return false;
      if (userRoleFilter === "anggota" && u.role !== "anggota") return false;
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        u.nama.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.divisi && u.divisi.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedKelas = `${tingkatKelas}-${rombelKelas}`;
    const tempId = `ang-${Date.now()}`;
    const newAnggota: AnggotaRecord = {
      id: tempId,
      tipe: activeTab as "tetap" | "ekskul",
      nama_lengkap: namaLengkap,
      nis,
      nisn: nisn || undefined,
      kelas: selectedKelas,
      jabatan,
      divisi: activeTab === "tetap" ? divisi : undefined,
      tahun_ajaran: "2026/2027",
      status: "aktif",
      no_hp: noHp || undefined,
    };

    setAnggotaList((prev) => [...prev, newAnggota]);
    logAction(
      "REGISTER_ANGGOTA",
      "anggota",
      newAnggota.id,
      `Mendaftarkan ${activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}: ${namaLengkap} (${selectedKelas}) - ${jabatan}`
    );

    try {
      const { data } = await supabase
        .from("anggota")
        .insert({
          tipe: activeTab,
          nama_lengkap: namaLengkap,
          nis,
          nisn: nisn || null,
          kelas: selectedKelas,
          jabatan,
          divisi: activeTab === "tetap" ? divisi : null,
          tahun_ajaran: "2026/2027",
          status: "aktif",
          no_hp: noHp || null,
        })
        .select()
        .single();

      if (data) {
        setAnggotaList((prev) =>
          prev.map((a) => (a.id === tempId ? (data as AnggotaRecord) : a))
        );
      }
    } catch (err) {
      console.error("Error inserting anggota to Supabase:", err);
    }

    setNamaLengkap("");
    setNis("");
    setNisn("");
    setNoHp("");
    setTingkatKelas("VIII");
    setRombelKelas("A");
    setJabatan("Anggota");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Header Responsif */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-spectrum-cyan/15 text-spectrum-cyan border border-spectrum-cyan/30">
              BUKU INDUK STUDIO
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2 mt-1">
            <Users className="w-5 h-5 text-spectrum-cyan shrink-0" />
            <span>Direktori Anggota &amp; Pengurus</span>
          </h1>
          <p className="text-xs text-studio-text-secondary mt-0.5">
            Basis data keanggotaan ekstrakurikuler &amp; struktur akun Broadcast Spensa.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Tombol Export Excel / CSV sesuai database */}
          {(activeTab === "ekskul" || activeTab === "tetap") && (
            <button
              onClick={() => {
                const targetData = anggotaList.filter((a) => a.tipe === activeTab);
                const prefix = activeTab === "ekskul" ? "Data_Anggota_Ekskul" : "Data_Anggota_Tetap";
                exportAnggotaToCSV(targetData, prefix);
              }}
              title="Download data dari database ke format Excel / CSV"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-200 hover:text-white text-xs font-semibold border border-studio-border-subtle transition-all min-h-[42px]"
            >
              <Download className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Export <span className="hidden xs:inline sm:inline">CSV</span></span>
            </button>
          )}

          {activeTab === "pembina" || activeTab === "users" ? (
            isPembinaOrAdmin && (
              <button
                onClick={() => setIsPembinaModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/40 min-h-[42px]"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>+ Akun / Pembina</span>
              </button>
            )
          ) : (
            canCreateAnggota && (
              <button
                onClick={() => setIsModalOpen(true)}
                aria-label="Registrasi Anggota Baru"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[42px]"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>+ Siswa {activeTab === "tetap" ? "Tetap" : "Ekskul"}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs Segregation (Pill-based horizontal scroll on mobile) */}
      <div className="flex items-center gap-2 border-b border-studio-border-subtle overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setActiveTab("tetap")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border min-h-[38px] ${
            activeTab === "tetap"
              ? "bg-spectrum-cyan/15 text-spectrum-cyan border-spectrum-cyan/40 shadow-cyan font-extrabold"
              : "bg-surface-1 text-studio-text-secondary hover:text-white border-studio-border-subtle"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Anggota Tetap</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-spectrum-cyan/20 text-spectrum-cyan">
            {anggotaList.filter((a) => a.tipe === "tetap").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ekskul")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border min-h-[38px] ${
            activeTab === "ekskul"
              ? "bg-orbital-violet/20 text-orbital-magenta border-orbital-violet/50 shadow-orbital font-extrabold"
              : "bg-surface-1 text-studio-text-secondary hover:text-white border-studio-border-subtle"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Anggota Ekskul</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-orbital-violet/20 text-orbital-magenta">
            {anggotaList.filter((a) => a.tipe === "ekskul").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("pembina")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border min-h-[38px] ${
            activeTab === "pembina"
              ? "bg-spectrum-amber/15 text-spectrum-amber border-spectrum-amber/40 shadow-amber font-extrabold"
              : "bg-surface-1 text-studio-text-secondary hover:text-white border-studio-border-subtle"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Dewan Pembina</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-spectrum-amber/20 text-spectrum-amber">
            {pembinaList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("users")}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap border min-h-[38px] ${
            activeTab === "users"
              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/40 font-extrabold"
              : "bg-surface-1 text-studio-text-secondary hover:text-white border-studio-border-subtle"
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Akun Pengguna</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
            {(allUsers || []).length}
          </span>
        </button>
      </div>

      {/* Search & Quick Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Cari data"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "users"
                ? "Cari nama, email, role..."
                : activeTab === "pembina"
                ? "Cari nama, email pembina..."
                : "Cari nama, NIS, kelas, jabatan, divisi..."
            }
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[42px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {(activeTab === "tetap" || activeTab === "ekskul") && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(["all", "VII", "VIII", "IX"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKelasFilter(k)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all border ${
                  kelasFilter === k
                    ? "bg-white/15 text-white border-white/30 font-bold"
                    : "bg-surface-1 text-slate-400 border-studio-border-subtle hover:text-white"
                }`}
              >
                {k === "all" ? "Semua Kelas" : `Kelas ${k}`}
              </button>
            ))}
          </div>
        )}

        {activeTab === "users" && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "Semua Akun", count: (allUsers || []).length },
              {
                id: "ketua_divisi",
                label: "Ketua Divisi",
                count: (allUsers || []).filter((u) => u.role === "ketua_divisi").length,
              },
              {
                id: "pembina_admin",
                label: "Pembina & Admin",
                count: (allUsers || []).filter((u) => u.role === "pembina" || u.role === "administrator").length,
              },
              {
                id: "pengurus",
                label: "Pengurus Inti",
                count: (allUsers || []).filter((u) => ["ketua_broadcast", "sekretaris", "bendahara"].includes(u.role)).length,
              },
              {
                id: "kreatif_pj",
                label: "Divisi & PJ",
                count: (allUsers || []).filter((u) => ["div_kreatif", "pj"].includes(u.role)).length,
              },
              {
                id: "anggota",
                label: "Anggota",
                count: (allUsers || []).filter((u) => u.role === "anggota").length,
              },
            ].map((rf) => (
              <button
                key={rf.id}
                onClick={() => setUserRoleFilter(rf.id)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                  userRoleFilter === rf.id
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold shadow-sm"
                    : "bg-surface-1 text-slate-400 border-studio-border-subtle hover:text-white"
                }`}
              >
                <span>{rf.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/10 font-bold">
                  {rf.count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Content: Semua Pengguna (Users) View ────────────────────────────── */}
      {activeTab === "users" ? (
        filteredUsers.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-surface-1 border border-studio-border-subtle border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <Shield className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Tidak Ada Pengguna Ditemukan</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {searchQuery
                ? `Tidak ada akun yang cocok dengan kata kunci "${searchQuery}".`
                : "Belum ada akun pengguna terdaftar di sistem."}
            </p>
            {isPembinaOrAdmin && (
              <button
                onClick={() => setIsPembinaModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Pengguna Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-studio-text-secondary px-1">
              <span>
                Menampilkan <strong className="text-white">{filteredUsers.length}</strong> akun pengguna terdaftar
              </span>
              <span className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Database Supabase Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => {
                const badge = getRoleBadge(user.role);
                const isSelf = user.id === currentUser.id;
                return (
                  <div
                    key={user.id}
                    className={`p-4 sm:p-5 rounded-2xl bg-surface-1 border transition-all space-y-3 relative group ${
                      isSelf
                        ? "border-spectrum-cyan/50 shadow-cyan"
                        : "border-studio-border-subtle hover:border-studio-border-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.className}`}>
                        {badge.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        AKTIF
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/30 via-cyan-500/20 to-pink-600/30 border border-white/10 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm">
                        {user.nama ? user.nama.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white leading-snug truncate">
                            {user.nama}
                          </h3>
                          {isSelf && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/40">
                              Anda
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs space-y-1.5 text-slate-300">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Hak Akses:</span>
                        <span className="text-white font-semibold capitalize">{user.role.replace(/_/g, " ")}</span>
                      </div>
                      {user.divisi && (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400">Divisi:</span>
                          <span className="text-spectrum-cyan font-mono text-[11px]">{user.divisi}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1 border-t border-studio-border-subtle">
                        <span className="text-slate-400 text-[10px]">User ID:</span>
                        <span className="text-slate-400 font-mono text-[10px] truncate max-w-[140px]">{user.id}</span>
                      </div>
                    </div>

                    {/* Baris Aksi Pengguna */}
                    <div className="flex items-center gap-2 pt-2 border-t border-studio-border-subtle">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailUser(user)}
                        className="flex-1 px-2.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-studio-border-subtle hover:border-spectrum-cyan/40 min-h-[40px]"
                      >
                        <Eye className="w-3.5 h-3.5 text-spectrum-cyan" />
                        <span>Detail</span>
                      </button>

                      {isPembinaOrAdmin && (
                        <button
                          type="button"
                          onClick={() => setSelectedEditUser(user)}
                          title="Edit Akun Pengguna"
                          className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-300 hover:text-white transition-all border border-studio-border-subtle hover:border-spectrum-cyan/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        >
                          <Edit className="w-3.5 h-3.5 text-spectrum-cyan" />
                        </button>
                      )}

                      {canResetPassword && (
                        <button
                          type="button"
                          onClick={() => setSelectedResetUser(user)}
                          title="Reset Kata Sandi Akun"
                          className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-all border border-amber-500/25 hover:border-amber-500/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        >
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                      )}

                      {currentUser.role === "administrator" && !isSelf && (
                        <button
                          type="button"
                          onClick={() => setSelectedDeleteUser(user)}
                          title="Hapus Akun Pengguna"
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/25 hover:border-rose-500/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : activeTab === "pembina" ? (
        filteredPembina.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-surface-1 border border-studio-border-subtle border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/15 border border-violet-500/20 text-violet-400 mx-auto flex items-center justify-center mb-3">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Belum Ada Dewan Pembina Terdaftar</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Tambahkan guru pembina ekstrakurikuler untuk memberikan hak supervisi dan pengesahan naskah.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              {isPembinaOrAdmin && (
                <button
                  onClick={() => setIsPembinaModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Tambah Pembina Baru</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab("users")}
                className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-200 text-xs font-semibold transition-all border border-studio-border-subtle inline-flex items-center gap-2 min-h-[44px]"
              >
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Lihat Semua Akun Pengguna ({(allUsers || []).length})</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPembina.map((pem) => (
              <div
                key={pem.id}
                className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-violet-500/40 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    pem.role === "administrator"
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/35"
                      : "bg-orbital-violet/20 text-orbital-magenta border-orbital-violet/35"
                  }`}>
                    {pem.role === "administrator" ? "ADMINISTRATOR / PENGAWAS" : "DEWAN PEMBINA"}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AKTIF
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/30 to-pink-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-base shrink-0">
                    {pem.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white leading-snug truncate">
                      {pem.nama}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      {pem.email}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Otoritas:</span>
                    <span className="text-white font-semibold">Supervisi &amp; Approval Gate 1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Akses:</span>
                    <span className="text-spectrum-cyan font-mono">Monitoring Center</span>
                  </div>
                </div>

                {/* Baris Aksi Pembina */}
                <div className="flex items-center gap-2 pt-2 border-t border-studio-border-subtle">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailUser(pem)}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-studio-border-subtle hover:border-violet-500/40 min-h-[40px]"
                  >
                    <Eye className="w-3.5 h-3.5 text-violet-400" />
                    <span>Detail</span>
                  </button>

                  {isPembinaOrAdmin && (
                    <button
                      type="button"
                      onClick={() => setSelectedEditUser(pem)}
                      title="Edit Akun Pembina"
                      className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-300 hover:text-white transition-all border border-studio-border-subtle hover:border-violet-500/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Edit className="w-3.5 h-3.5 text-violet-400" />
                    </button>
                  )}

                  {canResetPassword && (
                    <button
                      type="button"
                      onClick={() => setSelectedResetUser(pem)}
                      title="Reset Kata Sandi Akun"
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-all border border-amber-500/25 hover:border-amber-500/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  )}

                  {currentUser.role === "administrator" && pem.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => setSelectedDeleteUser(pem)}
                      title="Hapus Akun Pembina"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/25 hover:border-rose-500/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Content: Anggota Tetap / Ekskul Grid ────────────────────────────── */
        filteredMembers.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-surface-1 border border-studio-border-subtle border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-studio-border-subtle text-slate-500 mx-auto flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Belum Ada Data {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Daftarkan siswa baru ke direktori buku induk melalui tombol di bawah ini.
            </p>
            {canCreateAnggota && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan inline-flex items-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-2 px-1 text-xs text-studio-text-secondary">
              <span>
                Menampilkan <strong className="text-white">{filteredMembers.length}</strong> siswa {activeTab === "ekskul" ? "ekstrakurikuler" : "anggota tetap"}
              </span>
              {kelasFilter !== "all" && (
                <button
                  onClick={() => setKelasFilter("all")}
                  className="text-spectrum-cyan hover:underline text-[11px] font-mono"
                >
                  Reset Filter (Kelas {kelasFilter})
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {filteredMembers.map((ang) => (
              <div
                key={ang.id}
                className="p-4 sm:p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all space-y-3 relative group"
              >
                {/* Header Kartu: Inisial Avatar, Nama, NIS, dan Status */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 shadow-sm ${
                      ang.tipe === "tetap"
                        ? "bg-gradient-to-br from-cyan-600/25 to-blue-600/25 text-spectrum-cyan border border-spectrum-cyan/35"
                        : "bg-gradient-to-br from-violet-600/25 to-pink-600/25 text-orbital-magenta border border-orbital-violet/35"
                    }`}
                  >
                    {ang.nama_lengkap.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-2 text-white border border-studio-border-subtle">
                        NIS {ang.nis}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                          ang.status === "aktif"
                            ? "bg-spectrum-jade/15 text-spectrum-jade border-spectrum-jade/30"
                            : ang.status === "cuti"
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {ang.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug truncate mt-1">
                      {ang.nama_lengkap}
                    </h3>
                    <p className="text-[11px] text-studio-text-secondary font-mono flex items-center gap-1 mt-0.5 truncate">
                      <GraduationCap className="w-3 h-3 text-spectrum-cyan shrink-0" />
                      <span>Kelas {ang.kelas}</span>
                      <span>·</span>
                      <span>TA {ang.tahun_ajaran}</span>
                    </p>
                  </div>
                </div>

                {/* Box Detail: Jabatan, Divisi, WhatsApp */}
                <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-studio-text-secondary text-[11px]">Jabatan:</span>
                    <strong className="text-white truncate max-w-[170px] text-right font-medium">
                      {ang.jabatan}
                    </strong>
                  </div>

                  {ang.divisi && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-studio-text-secondary text-[11px]">Divisi:</span>
                      <span className="text-spectrum-cyan font-semibold text-[11px] font-mono">
                        {ang.divisi}
                      </span>
                    </div>
                  )}

                  {ang.no_hp && (
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-studio-border-subtle">
                      <span className="text-studio-text-secondary text-[11px] flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-400" /> WhatsApp:
                      </span>
                      <a
                        href={`https://wa.me/${ang.no_hp.replace(/\D/g, "").replace(/^0/, "62")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <span>{ang.no_hp}</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Baris Aksi: Detail (Ketua, Sekretaris, Bendahara, Pembina, Admin), Edit & Hapus (Pembina, Admin, Sekretaris) */}
                <div className="flex items-center gap-2 pt-2 border-t border-studio-border-subtle">
                  {canViewDetail && (
                    <button
                      type="button"
                      onClick={() => setSelectedDetailAnggota(ang)}
                      className="flex-1 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-studio-border-subtle hover:border-spectrum-cyan/40 min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-spectrum-cyan" />
                      <span>Lihat Detail</span>
                    </button>
                  )}

                  {canEditAnggota && (
                    <button
                      type="button"
                      onClick={() => setSelectedEditAnggota(ang)}
                      title="Edit Data Siswa"
                      className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-300 hover:text-white transition-all border border-studio-border-subtle hover:border-spectrum-cyan/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Edit className="w-3.5 h-3.5 text-spectrum-cyan" />
                    </button>
                  )}

                  {canDeleteAnggota && (
                    <button
                      type="button"
                      onClick={() => setSelectedDeleteAnggota(ang)}
                      title="Hapus Data Siswa"
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all border border-rose-500/25 hover:border-rose-500/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        )
      )}

      {/* ── Modal Tambah Anggota ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
                <h3 className="text-base font-bold text-white">
                  Registrasi {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    type="text"
                    required
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    placeholder="Contoh: Muhammad Farhan"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>

                {/* NIS & Dropdown Kelas (Tingkat + Rombel) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Nomor Induk Siswa (NIS) *
                    </label>
                    <input
                      type="text"
                      required
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      placeholder="89401"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Kelas (Tingkat &amp; Rombel) *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        aria-label="Tingkat Kelas"
                        value={tingkatKelas}
                        onChange={(e) => setTingkatKelas(e.target.value as "VII" | "VIII" | "IX")}
                        className="w-full px-2.5 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                      >
                        {TINGKAT_KELAS_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-surface-2 text-white">
                            Kelas {t}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="Ruang Rombel"
                        value={rombelKelas}
                        onChange={(e) => setRombelKelas(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                      >
                        {ROMBEL_OPTIONS.map((r) => (
                          <option key={r} value={r} className="bg-surface-2 text-white">
                            Ruang {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      Pilihan: <span className="text-spectrum-cyan font-bold">{tingkatKelas}-{rombelKelas}</span>
                    </p>
                  </div>
                </div>

                {/* Jabatan Struktural Dropdown (Sesuai Role) & Divisi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Jabatan Struktural (Sesuai Role) *
                    </label>
                    <select
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    >
                      {JABATAN_ROLE_OPTIONS.map((j) => (
                        <option key={j} value={j} className="bg-surface-2 text-white">
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeTab === "tetap" && (
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        Peminatan Divisi *
                      </label>
                      <select
                        value={divisi}
                        onChange={(e) => setDivisi(e.target.value as DivisiName)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                      >
                        {DIVISI_OPTIONS.map((d) => (
                          <option key={d} value={d} className="bg-surface-2 text-white">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* NISN & No WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      NISN (Opsional)
                    </label>
                    <input
                      type="text"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="0081234567"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-studio-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-semibold text-studio-text-secondary hover:text-white transition-colors min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-initial px-5 py-2 rounded-lg bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px] flex items-center justify-center"
                  >
                    Simpan Anggota
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Tambah Pembina ─────────────────────────────────────────────── */}
      <TambahPembinaModal
        isOpen={isPembinaModalOpen}
        onClose={() => setIsPembinaModalOpen(false)}
      />

      {/* ── Modal Detail Anggota (Ketua, Sekretaris, Bendahara, Pembina, Admin) ── */}
      <AnggotaDetailModal
        isOpen={!!selectedDetailAnggota}
        onClose={() => setSelectedDetailAnggota(null)}
        anggota={selectedDetailAnggota}
        onEdit={(ang) => setSelectedEditAnggota(ang)}
        onDelete={(ang) => setSelectedDeleteAnggota(ang)}
      />

      {/* ── Modal Edit Anggota (Pembina, Admin, Sekretaris) ─────────────────── */}
      <EditAnggotaModal
        isOpen={!!selectedEditAnggota}
        onClose={() => setSelectedEditAnggota(null)}
        anggota={selectedEditAnggota}
      />

      {/* ── Modal Hapus Anggota (Pembina & Admin) ────────────────────────────── */}
      <HapusAnggotaModal
        isOpen={!!selectedDeleteAnggota}
        onClose={() => setSelectedDeleteAnggota(null)}
        anggota={selectedDeleteAnggota}
      />

      {/* ── Modal Detail Pengguna (All authenticated users) ───────────────────── */}
      <UserDetailModal
        isOpen={!!selectedDetailUser}
        onClose={() => setSelectedDetailUser(null)}
        user={selectedDetailUser}
        onResetPassword={(u) => {
          setSelectedDetailUser(null);
          setSelectedResetUser(u);
        }}
        onEdit={(u) => {
          setSelectedDetailUser(null);
          setSelectedEditUser(u);
        }}
        onDelete={(u) => {
          setSelectedDetailUser(null);
          setSelectedDeleteUser(u);
        }}
      />

      {/* ── Modal Edit Pengguna (Admin & Pembina) ───────────────────────────── */}
      <EditUserModal
        isOpen={!!selectedEditUser}
        onClose={() => setSelectedEditUser(null)}
        user={selectedEditUser}
      />

      {/* ── Modal Hapus Pengguna (Administrator Only) ─────────────────────────── */}
      <HapusUserModal
        isOpen={!!selectedDeleteUser}
        onClose={() => setSelectedDeleteUser(null)}
        user={selectedDeleteUser}
      />

      {/* ── Modal Reset Password Pengguna (Administrator & Pembina) ─────────── */}
      <ResetPasswordModal
        isOpen={!!selectedResetUser}
        onClose={() => setSelectedResetUser(null)}
        user={selectedResetUser}
      />
    </div>
  );
}
