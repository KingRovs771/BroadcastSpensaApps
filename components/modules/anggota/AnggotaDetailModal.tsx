"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnggotaRecord } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import { formatIDR } from "@/lib/utils/currency";
import {
  X,
  User,
  GraduationCap,
  Calendar,
  Award,
  Shield,
  Phone,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit,
  Trash2,
  FileSpreadsheet,
  Key,
} from "lucide-react";

interface AnggotaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  anggota: AnggotaRecord | null;
  onEdit?: (anggota: AnggotaRecord) => void;
  onDelete?: (anggota: AnggotaRecord) => void;
  onCreateUser?: (anggota: AnggotaRecord) => void;
}

export function AnggotaDetailModal({
  isOpen,
  onClose,
  anggota,
  onEdit,
  onDelete,
  onCreateUser,
}: AnggotaDetailModalProps) {
  const { currentUser, absensiList, kasPembayaranList, kasSettings, allUsers } = useSession();

  if (!isOpen || !anggota) return null;

  // Hak akses kontrol
  const isPembinaOrAdmin =
    currentUser.role === "pembina" || currentUser.role === "administrator";
  const isSekretaris = currentUser.role === "sekretaris";
  const canEdit = isPembinaOrAdmin || isSekretaris;
  const canDelete = isPembinaOrAdmin;

  // Hitung riwayat presensi siswa
  const memberAbsensi = absensiList.filter(
    (a) => a.anggota_id === anggota.id || a.anggota_id === anggota.nis
  );
  const totalPresensiRecorded = memberAbsensi.length;
  const hadirCount = memberAbsensi.filter((a) => a.status === "masuk").length;
  const izinCount = memberAbsensi.filter((a) => a.status === "izin").length;
  const sakitCount = memberAbsensi.filter((a) => a.status === "sakit").length;
  const alphaCount = memberAbsensi.filter((a) => a.status === "alpha").length;
  const attendanceRate =
    totalPresensiRecorded > 0
      ? Math.round((hadirCount / totalPresensiRecorded) * 100)
      : 100;

  // Hitung riwayat kas siswa
  const memberKas = kasPembayaranList.filter(
    (k) => k.anggota_id === anggota.id || k.anggota_id === anggota.nis
  );
  const totalKasPaid = memberKas
    .filter((k) => k.status === "lunas")
    .reduce((sum, k) => sum + k.nominal, 0);
  const totalMingguLunas = memberKas.filter((k) => k.status === "lunas").length;

  // Format link WhatsApp
  const sanitizedPhone = anggota.no_hp
    ? anggota.no_hp.replace(/\D/g, "").replace(/^0/, "62")
    : null;

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-anggota-title"
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

        {/* Modal Container */}
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
                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold shadow-md shrink-0 ${
                  anggota.tipe === "tetap"
                    ? "bg-gradient-to-br from-cyan-600/30 to-blue-600/30 text-spectrum-cyan border border-spectrum-cyan/40"
                    : "bg-gradient-to-br from-violet-600/30 to-pink-600/30 text-orbital-magenta border border-orbital-violet/40"
                }`}
              >
                {anggota.nama_lengkap.charAt(0).toUpperCase()}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3
                    id="detail-anggota-title"
                    className="text-base font-bold text-white leading-tight"
                  >
                    {anggota.nama_lengkap}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${
                      anggota.status === "aktif"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : anggota.status === "cuti"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        : "bg-rose-500/15 text-rose-400 border-rose-500/30"
                    }`}
                  >
                    {anggota.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-studio-text-secondary">
                  <span className="font-mono font-semibold text-white">
                    NIS: {anggota.nis}
                  </span>
                  {anggota.nisn && (
                    <span className="font-mono text-slate-400">
                      · NISN: {anggota.nisn}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold uppercase ${
                      anggota.tipe === "tetap"
                        ? "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30"
                        : "bg-purple-500/15 text-purple-400 border border-purple-500/30"
                    }`}
                  >
                    {anggota.tipe === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Tutup detail"
              className="p-2 rounded-xl text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Grid Informasi Pokok */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
              <span className="text-[10px] font-mono text-studio-text-muted flex items-center gap-1.5 uppercase font-bold">
                <GraduationCap className="w-3.5 h-3.5 text-spectrum-cyan" />
                Kelas &amp; Tahun Ajaran
              </span>
              <p className="text-sm font-bold text-white">
                Kelas {anggota.kelas}
              </p>
              <p className="text-[11px] font-mono text-studio-text-secondary">
                Tahun Ajaran {anggota.tahun_ajaran}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
              <span className="text-[10px] font-mono text-studio-text-muted flex items-center gap-1.5 uppercase font-bold">
                <Award className="w-3.5 h-3.5 text-spectrum-amber" />
                Jabatan &amp; Divisi
              </span>
              <p className="text-sm font-bold text-white">{anggota.jabatan}</p>
              <p className="text-[11px] font-mono text-spectrum-cyan">
                {anggota.divisi ? `Divisi ${anggota.divisi}` : "Umum / Non-Spesifik"}
              </p>
            </div>
          </div>

          {/* Kontak WhatsApp Siswa */}
          <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono text-studio-text-muted uppercase font-bold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                Kontak WhatsApp Siswa
              </span>
              <p className="text-sm font-mono font-bold text-white">
                {anggota.no_hp || "Nomor telepon belum diisi"}
              </p>
            </div>

            {sanitizedPhone && (
              <a
                href={`https://wa.me/${sanitizedPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold border border-emerald-500/40 flex items-center gap-1.5 transition-all self-start sm:self-auto min-h-[40px]"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Hubungi via WhatsApp</span>
              </a>
            )}
          </div>

          {/* Akun Pengguna Aplikasi (Login Sistem) */}
          {(() => {
            const matchedUser = (allUsers || []).find(
              (u) =>
                u.nama.toLowerCase().trim() === anggota.nama_lengkap.toLowerCase().trim() ||
                (anggota.no_hp && u.email && u.email.includes(anggota.no_hp))
            );

            return (
              <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-studio-text-muted uppercase font-bold flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-spectrum-cyan" />
                    Akun Pengguna Aplikasi (Login Sistem)
                  </span>
                  {matchedUser ? (
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-white font-mono">{matchedUser.email}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          AKUN AKTIF · {matchedUser.role.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Siswa terdaftar sebagai pengguna resmi sistem Broadcast Spensa OS.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-slate-300">
                        Belum memiliki akun pengguna sistem.
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Siswa belum dapat login ke dashboard sistem secara mandiri.
                      </p>
                    </div>
                  )}
                </div>

                {!matchedUser && isPembinaOrAdmin && onCreateUser && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCreateUser(anggota);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 self-start sm:self-auto min-h-[40px] whitespace-nowrap"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span>+ Buatkan Akun Login</span>
                  </button>
                )}
              </div>
            );
          })()}

          {/* Tabular Insights: Presensi & Kas Live */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Presensi Kehadiran */}
            <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-spectrum-jade" />
                  Presensi Kehadiran
                </h4>
                <span className="text-[10px] font-mono font-bold text-spectrum-jade bg-spectrum-jade/15 px-2 py-0.5 rounded border border-spectrum-jade/30">
                  {attendanceRate}% Hadir
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="p-2 rounded-lg bg-surface-2 border border-studio-border-subtle">
                  <span className="text-[9px] font-mono text-slate-400 block">Masuk</span>
                  <span className="text-xs font-bold text-emerald-400">{hadirCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-2 border border-studio-border-subtle">
                  <span className="text-[9px] font-mono text-slate-400 block">Izin</span>
                  <span className="text-xs font-bold text-amber-400">{izinCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-2 border border-studio-border-subtle">
                  <span className="text-[9px] font-mono text-slate-400 block">Sakit</span>
                  <span className="text-xs font-bold text-sky-400">{sakitCount}</span>
                </div>
                <div className="p-2 rounded-lg bg-surface-2 border border-studio-border-subtle">
                  <span className="text-[9px] font-mono text-slate-400 block">Alpha</span>
                  <span className="text-xs font-bold text-rose-400">{alphaCount}</span>
                </div>
              </div>
            </div>

            {/* Rekam Iuran Kas Siswa */}
            <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-spectrum-cyan" />
                  Iuran Kas Anggota
                </h4>
                <span className="text-[10px] font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                  {totalMingguLunas} Pekan Lunas
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-surface-2 border border-studio-border-subtle flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Total Masuk Kas:</span>
                <span className="text-sm font-bold font-mono text-spectrum-jade">
                  {formatIDR(totalKasPaid)}
                </span>
              </div>
              <p className="text-[10px] font-mono text-studio-text-muted">
                Tarif standar: {formatIDR(kasSettings.nominal)} / {kasSettings.periode_type}
              </p>
            </div>
          </div>

          {/* Catatan Tambahan (jika ada) */}
          {anggota.catatan && (
            <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1 text-xs">
              <span className="text-[10px] font-mono text-studio-text-muted uppercase font-bold">
                Catatan Khusus
              </span>
              <p className="text-slate-300 italic">{anggota.catatan}</p>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pt-3 border-t border-studio-border-subtle">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {canEdit && onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(anggota);
                  }}
                  className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-surface-3 hover:bg-surface-1 text-white text-xs font-bold border border-studio-border-medium hover:border-spectrum-cyan/50 flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                >
                  <Edit className="w-4 h-4 text-spectrum-cyan" />
                  <span>Edit Data</span>
                </button>
              )}

              {canDelete && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onDelete(anggota);
                  }}
                  className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold border border-rose-500/30 flex items-center justify-center gap-2 transition-colors min-h-[44px]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Hapus</span>
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors min-h-[44px]"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
