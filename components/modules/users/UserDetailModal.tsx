"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, UserRole } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import {
  X,
  Shield,
  Mail,
  User,
  Copy,
  Check,
  Key,
  GraduationCap,
  Phone,
  MessageCircle,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  Edit,
  Trash2,
} from "lucide-react";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onResetPassword?: (user: UserProfile) => void;
  onEdit?: (user: UserProfile) => void;
  onDelete?: (user: UserProfile) => void;
}

export function UserDetailModal({
  isOpen,
  onClose,
  user,
  onResetPassword,
  onEdit,
  onDelete,
}: UserDetailModalProps) {
  const { currentUser, anggotaList, absensiList, kasPembayaranList } = useSession();
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUser.id;
  const canEdit = currentUser.role === "administrator" || currentUser.role === "pembina";
  const canDelete = currentUser.role === "administrator";
  const canResetPassword =
    currentUser.role === "administrator" || currentUser.role === "pembina";

  // Cari apakah akun user ini terhubung dengan data Buku Induk Anggota
  const linkedAnggota = anggotaList.find(
    (a) =>
      a.id === user.id ||
      a.nama_lengkap.trim().toLowerCase() === user.nama.trim().toLowerCase()
  );

  // Hitung statistik presensi jika terhubung dengan anggota
  const memberAbsensi = linkedAnggota
    ? absensiList.filter(
        (a) => a.anggota_id === linkedAnggota.id || a.anggota_id === linkedAnggota.nis
      )
    : [];
  const hadirCount = memberAbsensi.filter((a) => a.status === "masuk").length;
  const attendanceRate =
    memberAbsensi.length > 0
      ? Math.round((hadirCount / memberAbsensi.length) * 100)
      : 100;

  // Hitung kas jika terhubung
  const memberKas = linkedAnggota
    ? kasPembayaranList.filter(
        (k) => k.anggota_id === linkedAnggota.id || k.anggota_id === linkedAnggota.nis
      )
    : [];
  const totalMingguLunas = memberKas.filter((k) => k.status === "lunas").length;

  const handleCopyId = () => {
    navigator.clipboard.writeText(user.id);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case "administrator":
        return {
          label: "Administrator Sistem",
          badge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
          gradient: "from-rose-600/30 to-pink-600/30 text-rose-400 border-rose-500/40",
          desc: "Memiliki kendali penuh atas seluruh sistem, manajemen pengguna, migrasi basis data Supabase, audit log, dan pengaturan platform.",
          authority: "Superuser · Master Control",
        };
      case "pembina":
        return {
          label: "Dewan Pembina Ekstrakurikuler",
          badge: "bg-orbital-violet/20 text-orbital-magenta border-orbital-violet/35",
          gradient: "from-violet-600/30 to-pink-600/30 text-violet-300 border-violet-500/40",
          desc: "Supervisi umum seluruh divisi, approval naskah/produksi Gate 1, kendali Buku Kas Pembina (BOS/Sponsor), dan monitoring absensi.",
          authority: "Supervisi & Approval Gate 1",
        };
      case "ketua_broadcast":
        return {
          label: "Ketua Umum Broadcast",
          badge: "bg-spectrum-cobalt/20 text-spectrum-cobalt border-spectrum-cobalt/35",
          gradient: "from-blue-600/30 to-cyan-600/30 text-sky-300 border-sky-500/40",
          desc: "Memimpin seluruh organisasi ekstrakurikuler, validasi naskah Gate 2, otorisasi penerbitan karya, dan konfigurasi iuran kas.",
          authority: "Pimpinan Umum & Approval Gate 2",
        };
      case "ketua_divisi":
        return {
          label: `Ketua Divisi ${user.divisi || ""}`,
          badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
          gradient: "from-amber-600/30 to-yellow-600/30 text-amber-300 border-amber-500/40",
          desc: `Mengkoordinasikan anggota pada Divisi ${user.divisi || ""}, melakukan kurasi materi teknis, dan verifikasi tugas kanban project.`,
          authority: "Kepala Operasional Divisi",
        };
      case "sekretaris":
        return {
          label: "Sekretaris Organisasi",
          badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
          gradient: "from-emerald-600/30 to-teal-600/30 text-emerald-300 border-emerald-500/40",
          desc: "Pengelolaan presensi mingguan anggota, pencatatan risalah notulen rapat resmi, dan administrasi buku induk siswa.",
          authority: "Notulensi & Presensi",
        };
      case "bendahara":
        return {
          label: "Bendahara Organisasi",
          badge: "bg-teal-500/15 text-teal-400 border-teal-500/30",
          gradient: "from-teal-600/30 to-cyan-600/30 text-teal-300 border-teal-500/40",
          desc: "Pencatatan setoran iuran kas mingguan, penagihan tunggakan iuran kas siswa, dan rekapitulasi buku kas.",
          authority: "Kas & Transaksi",
        };
      case "div_kreatif":
        return {
          label: "Staf Divisi Kreatif",
          badge: "bg-pink-500/15 text-pink-400 border-pink-500/30",
          gradient: "from-pink-600/30 to-rose-600/30 text-pink-300 border-pink-500/40",
          desc: "Penyusunan naskah video & podcast, pengajuan ide konten kreatif, dan pengelolaan pipeline produksi.",
          authority: "Pembuat Naskah & Konten",
        };
      case "pj":
        return {
          label: "Penanggung Jawab (PJ) Produksi",
          badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
          gradient: "from-purple-600/30 to-indigo-600/30 text-purple-300 border-purple-500/40",
          desc: "Penanggung jawab lapangan eksekusi project rekaman, pengunggahan tautan hasil karya, dan koordinasi tim teknis.",
          authority: "Pelaksana & Penyerahan Karya",
        };
      default:
        return {
          label: "Anggota Siswa",
          badge: "bg-cyan-500/15 text-spectrum-cyan border-cyan-500/30",
          gradient: "from-cyan-600/30 to-blue-600/30 text-cyan-300 border-cyan-500/40",
          desc: "Anggota aktif ekstrakurikuler Broadcast Spensa, berpartisipasi dalam agenda latihan mingguan, proyek video, dan pelatihan studio.",
          authority: "Anggota Aktif",
        };
    }
  };

  const roleInfo = getRoleInfo(user.role);

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
        />

        {/* Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10 space-y-4 sm:space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 sm:pb-4 border-b border-studio-border-subtle">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br border flex items-center justify-center text-lg font-bold shadow-md shrink-0 ${roleInfo.gradient}`}
              >
                {user.nama ? user.nama.charAt(0).toUpperCase() : "U"}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    id="user-detail-title"
                    className="text-base font-bold text-white leading-tight"
                  >
                    {user.nama}
                  </h3>
                  {isSelf && (
                    <span className="px-1.5 py-0.5 rounded bg-spectrum-cyan/20 text-spectrum-cyan text-[10px] font-bold border border-spectrum-cyan/40">
                      Akun Anda
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AKTIF
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{user.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Tutup detail pengguna"
              className="p-2 rounded-xl text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Kartu Identitas Akun & Akses */}
          <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-[10px] font-mono text-studio-text-muted uppercase font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-spectrum-cyan" />
                Hak Akses & Otoritas Sistem
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleInfo.badge}`}
              >
                {roleInfo.label}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {roleInfo.desc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-studio-border-subtle text-xs">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">Level Otoritas:</span>
                <span className="text-white font-semibold">{roleInfo.authority}</span>
              </div>
              {user.divisi && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block">Divisi Operasional:</span>
                  <span className="text-spectrum-cyan font-mono font-semibold">Divisi {user.divisi}</span>
                </div>
              )}
            </div>

            {/* Salin User ID */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-studio-border-subtle text-[11px]">
              <span className="text-slate-400 font-mono">User ID:</span>
              <div className="flex items-center gap-2">
                <code className="text-slate-300 font-mono bg-surface-2 px-2 py-1 rounded border border-studio-border-subtle text-[10px] max-w-[200px] truncate">
                  {user.id}
                </code>
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Salin User ID"
                  className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-slate-300 hover:text-white border border-studio-border-subtle transition-colors flex items-center gap-1 text-[10px]"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-slate-400" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Relasi Data Buku Induk Siswa (Linked Member) */}
          {linkedAnggota ? (
            <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-studio-text-muted uppercase font-bold flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-spectrum-amber" />
                  Data Siswa Terdaftar (Buku Induk)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${
                    linkedAnggota.tipe === "tetap"
                      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                      : "bg-purple-500/15 text-purple-400 border-purple-500/30"
                  }`}
                >
                  {linkedAnggota.tipe === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-surface-2 border border-studio-border-subtle">
                  <span className="text-[10px] font-mono text-slate-400 block">NIS / Kelas</span>
                  <strong className="text-white text-xs font-mono">
                    {linkedAnggota.nis} ({linkedAnggota.kelas})
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2 border border-studio-border-subtle">
                  <span className="text-[10px] font-mono text-slate-400 block">Presensi</span>
                  <strong className="text-spectrum-jade text-xs font-mono">
                    {attendanceRate}% Hadir ({hadirCount}x)
                  </strong>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-2 border border-studio-border-subtle col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-mono text-slate-400 block">Iuran Kas</span>
                  <strong className="text-white text-xs font-mono">
                    {totalMingguLunas} Pekan Lunas
                  </strong>
                </div>
              </div>

              {linkedAnggota.no_hp && (
                <div className="flex items-center justify-between pt-2 border-t border-studio-border-subtle text-xs">
                  <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                    <Phone className="w-3 h-3 text-emerald-400" /> WhatsApp:
                  </span>
                  <a
                    href={`https://wa.me/${linkedAnggota.no_hp.replace(/\D/g, "").replace(/^0/, "62")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{linkedAnggota.no_hp}</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle flex items-center gap-3 text-xs text-slate-400">
              <Award className="w-4 h-4 text-violet-400 shrink-0" />
              <span>
                Akun ini bertindak sebagai akun struktural/pembina dan tidak ditautkan ke catatan absensi siswa reguler.
              </span>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-studio-border-subtle">
            <div className="flex flex-wrap items-center gap-2">
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(user);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-spectrum-cyan/15 hover:bg-spectrum-cyan/25 text-spectrum-cyan text-xs font-bold border border-spectrum-cyan/35 flex items-center gap-1.5 transition-all min-h-[42px]"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Akun</span>
                </button>
              )}

              {canResetPassword && onResetPassword && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onResetPassword(user);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 text-xs font-bold border border-amber-500/35 hover:border-amber-400/50 flex items-center gap-1.5 transition-all min-h-[42px]"
                >
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Reset Sandi</span>
                </button>
              )}

              {canDelete && onDelete && !isSelf && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(user);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 hover:text-rose-300 text-xs font-bold border border-rose-500/35 hover:border-rose-500/50 flex items-center gap-1.5 transition-all min-h-[42px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors min-h-[42px]"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
