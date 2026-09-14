"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { UserProfile, UserRole } from "@/lib/mock/store";
import { TambahPembinaModal } from "@/components/modules/pembina/TambahPembinaModal";
import { UserDetailModal } from "@/components/modules/users/UserDetailModal";
import { EditUserModal } from "@/components/modules/users/EditUserModal";
import { HapusUserModal } from "@/components/modules/users/HapusUserModal";
import { ResetPasswordModal } from "@/components/modules/users/ResetPasswordModal";
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Key,
  Edit,
  Trash2,
  Eye,
  Mail,
  Filter,
  CheckCircle2,
  X,
  Lock,
} from "lucide-react";

export default function PenggunaPage() {
  const { currentUser, allUsers } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  // Modal states
  const [isTambahOpen, setIsTambahOpen] = useState(false);
  const [selectedDetailUser, setSelectedDetailUser] = useState<UserProfile | null>(null);
  const [selectedEditUser, setSelectedEditUser] = useState<UserProfile | null>(null);
  const [selectedDeleteUser, setSelectedDeleteUser] = useState<UserProfile | null>(null);
  const [selectedResetUser, setSelectedResetUser] = useState<UserProfile | null>(null);

  const isPrivileged =
    currentUser.role === "administrator" || currentUser.role === "pembina";

  if (!isPrivileged) {
    return (
      <div className="p-6 max-w-xl mx-auto text-center space-y-4 py-16">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Akses Dibatasi</h2>
        <p className="text-sm text-slate-400">
          Modul Kelola Akun Pengguna hanya dapat diakses oleh Administrator dan Dewan Pembina.
        </p>
      </div>
    );
  }

  // Filter users
  const filteredUsers = (allUsers || []).filter((u) => {
    // Role filter
    if (roleFilter === "ketua_divisi" && u.role !== "ketua_divisi") return false;
    if (
      roleFilter === "pembina_admin" &&
      !["pembina", "administrator"].includes(u.role)
    )
      return false;
    if (
      roleFilter === "pengurus" &&
      !["ketua_broadcast", "sekretaris", "bendahara"].includes(u.role)
    )
      return false;
    if (roleFilter === "kreatif_pj" && !["div_kreatif", "pj"].includes(u.role))
      return false;
    if (roleFilter === "anggota" && u.role !== "anggota") return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.nama.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchRole = u.role.toLowerCase().includes(q);
      const matchDivisi = u.divisi ? u.divisi.toLowerCase().includes(q) : false;
      return matchName || matchEmail || matchRole || matchDivisi;
    }

    return true;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case "administrator":
        return { label: "ADMINISTRATOR", className: "bg-rose-500/20 text-rose-400 border-rose-500/30" };
      case "pembina":
        return { label: "DEWAN PEMBINA", className: "bg-purple-500/20 text-purple-300 border-purple-500/30" };
      case "ketua_broadcast":
        return { label: "KETUA UMUM", className: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30" };
      case "ketua_divisi":
        return { label: "KETUA DIVISI", className: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
      case "sekretaris":
        return { label: "SEKRETARIS", className: "bg-teal-500/20 text-teal-300 border-teal-500/30" };
      case "bendahara":
        return { label: "BENDAHARA", className: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
      case "div_kreatif":
        return { label: "DIVISI KREATIF", className: "bg-pink-500/20 text-pink-300 border-pink-500/30" };
      case "pj":
        return { label: "PENANGGUNG JAWAB", className: "bg-blue-500/20 text-blue-300 border-blue-500/30" };
      default:
        return { label: "ANGGOTA BIASA", className: "bg-slate-500/20 text-slate-300 border-slate-500/30" };
    }
  };

  const ketuaDivisiCount = (allUsers || []).filter((u) => u.role === "ketua_divisi").length;
  const pembinaCount = (allUsers || []).filter((u) => ["pembina", "administrator"].includes(u.role)).length;
  const pengurusCount = (allUsers || []).filter((u) => ["ketua_broadcast", "sekretaris", "bendahara"].includes(u.role)).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-studio-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-spectrum-cyan/15 text-spectrum-cyan border border-spectrum-cyan/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              CRUD USER ACCOUNTS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-spectrum-cyan" />
            <span>Kelola Akun Pengguna</span>
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Manajemen penuh hak akses, peran struktural, dan kata sandi akun sistem Broadcast Spensa OS
          </p>
        </div>

        <button
          onClick={() => setIsTambahOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Akun Baru</span>
        </button>
      </div>

      {/* ── Metric Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Total Pengguna</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-white font-mono">
              {(allUsers || []).length}
            </strong>
            <span className="text-[10px] text-emerald-400 font-mono">Akun Aktif</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Ketua Divisi</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-spectrum-cyan font-mono">
              {ketuaDivisiCount}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">/ 7 Divisi</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Pembina &amp; Pengawas</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-purple-400 font-mono">
              {pembinaCount}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">Otoritas</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-1">
          <span className="text-[11px] font-mono text-slate-400 block">Pengurus Inti</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-2xl font-black text-indigo-400 font-mono">
              {pengurusCount}
            </strong>
            <span className="text-[10px] text-slate-400 font-mono">Struktural</span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label="Cari akun pengguna"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama, email, role, atau divisi..."
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
        </div>

        {/* Role tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: "all", label: "Semua Akun", count: (allUsers || []).length },
            { id: "ketua_divisi", label: "Ketua Divisi", count: ketuaDivisiCount },
            { id: "pembina_admin", label: "Pembina & Admin", count: pembinaCount },
            { id: "pengurus", label: "Pengurus Inti", count: pengurusCount },
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
              onClick={() => setRoleFilter(rf.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                roleFilter === rf.id
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
      </div>

      {/* ── User Cards Grid ── */}
      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl bg-surface-1 border border-studio-border-subtle border-dashed">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-sm font-bold text-white">Tidak Ada Akun Ditemukan</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {searchQuery
              ? `Tidak ada akun yang cocok dengan kata kunci "${searchQuery}".`
              : "Belum ada akun terdaftar pada kategori ini."}
          </p>
          <button
            onClick={() => setIsTambahOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all inline-flex items-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Baru</span>
          </button>
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
                  {/* Badge Role & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${badge.className}`}>
                      {badge.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      AKTIF
                    </span>
                  </div>

                  {/* Info Pokok */}
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

                  {/* Detail Tambahan */}
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
                      <span className="text-slate-400 font-mono text-[10px] truncate max-w-[150px]">{user.id}</span>
                    </div>
                  </div>

                  {/* Baris Tombol Aksi CRUD Lengkap */}
                  <div className="flex items-center gap-2 pt-2 border-t border-studio-border-subtle">
                    {/* Read / Detail */}
                    <button
                      type="button"
                      onClick={() => setSelectedDetailUser(user)}
                      className="flex-1 px-2.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-studio-border-subtle hover:border-spectrum-cyan/40 min-h-[40px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-spectrum-cyan" />
                      <span>Detail</span>
                    </button>

                    {/* Update / Edit */}
                    <button
                      type="button"
                      onClick={() => setSelectedEditUser(user)}
                      title="Edit Akun Pengguna"
                      className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-300 hover:text-white transition-all border border-studio-border-subtle hover:border-spectrum-cyan/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Edit className="w-3.5 h-3.5 text-spectrum-cyan" />
                    </button>

                    {/* Reset Kata Sandi */}
                    <button
                      type="button"
                      onClick={() => setSelectedResetUser(user)}
                      title="Reset Kata Sandi Akun"
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-all border border-amber-500/25 hover:border-amber-500/40 min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                    </button>

                    {/* Delete / Hapus (Administrator Only, non-self) */}
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
      )}

      {/* ── Modals CRUD ── */}

      {/* 1. Create Modal */}
      <TambahPembinaModal
        isOpen={isTambahOpen}
        onClose={() => setIsTambahOpen(false)}
      />

      {/* 2. Read Detail Modal */}
      <UserDetailModal
        isOpen={!!selectedDetailUser}
        onClose={() => setSelectedDetailUser(null)}
        user={selectedDetailUser}
        onEdit={(u) => {
          setSelectedDetailUser(null);
          setSelectedEditUser(u);
        }}
        onResetPassword={(u) => {
          setSelectedDetailUser(null);
          setSelectedResetUser(u);
        }}
        onDelete={(u) => {
          setSelectedDetailUser(null);
          setSelectedDeleteUser(u);
        }}
      />

      {/* 3. Update / Edit Modal */}
      <EditUserModal
        isOpen={!!selectedEditUser}
        onClose={() => setSelectedEditUser(null)}
        user={selectedEditUser}
      />

      {/* 4. Delete / Hapus Modal */}
      <HapusUserModal
        isOpen={!!selectedDeleteUser}
        onClose={() => setSelectedDeleteUser(null)}
        user={selectedDeleteUser}
      />

      {/* 5. Reset Password Modal */}
      <ResetPasswordModal
        isOpen={!!selectedResetUser}
        onClose={() => setSelectedResetUser(null)}
        user={selectedResetUser}
      />
    </div>
  );
}
