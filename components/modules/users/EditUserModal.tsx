"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, UserRole, DivisiName } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import {
  X,
  UserCheck,
  Shield,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Edit,
  Sparkles,
} from "lucide-react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess?: (updatedUser: UserProfile) => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: "pembina", label: "Dewan Pembina", desc: "Supervisi, Approval Gate 1 & Anggaran" },
  { value: "administrator", label: "Administrator", desc: "Akses penuh konfigurasi sistem" },
  { value: "ketua_broadcast", label: "Ketua Umum Broadcast", desc: "Approval Gate 2 & Operasional" },
  { value: "ketua_divisi", label: "Ketua Divisi", desc: "Approval Gate 2 Produksi Divisi" },
  { value: "sekretaris", label: "Sekretaris", desc: "Kelola data anggota, notulen & absensi" },
  { value: "bendahara", label: "Bendahara", desc: "Kelola kas anggota & pencatatan iuran" },
  { value: "div_kreatif", label: "Divisi Kreatif", desc: "Pembuatan naskah & script produksi" },
  { value: "pj", label: "Penanggung Jawab (PJ)", desc: "Submit link & kelola project produksi" },
  { value: "anggota", label: "Anggota Biasa", desc: "Akses viewer materi & jadwal" },
];

export function EditUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: EditUserModalProps) {
  const { currentUser, setAllUsers, setPembinaList, logAction, refreshData } = useSession();

  const [nama, setNama] = useState("");
  const [role, setRole] = useState<UserRole>("anggota");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setNama(user.nama || "");
      setRole(user.role);
      setDivisi(user.divisi || "Broadcasting");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUser.id;
  const needsDivisi = role === "div_kreatif" || role === "ketua_divisi" || role === "pj";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nama.trim()) {
      setErrorMsg("Nama lengkap tidak boleh kosong.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        targetUserId: user.id,
        nama: nama.trim(),
        role,
        divisi: needsDivisi ? divisi : null,
      };

      const res = await fetch("/api/users/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui akun pengguna.");
      }

      const updatedUser: UserProfile = {
        id: user.id,
        nama: nama.trim(),
        email: user.email,
        role,
        divisi: needsDivisi ? divisi : undefined,
        signature_url: user.signature_url,
      };

      // 1. Update state SessionContext
      setAllUsers((prev) =>
        prev.map((u) => (u.id === user.id ? updatedUser : u))
      );

      if (role === "pembina" || role === "administrator") {
        setPembinaList((prev) => {
          const exists = prev.some((p) => p.id === user.id);
          if (exists) return prev.map((p) => (p.id === user.id ? updatedUser : p));
          return [updatedUser, ...prev];
        });
      } else {
        // Hapus dari pembinaList jika rolenya diubah menjadi non-pembina
        setPembinaList((prev) => prev.filter((p) => p.id !== user.id));
      }

      logAction(
        "UPDATE_USER",
        "profiles",
        user.id,
        `Mengubah akun ${user.nama} -> ${nama.trim()} (${role.toUpperCase()})`
      );

      setSuccessMsg(`Akun ${nama.trim()} berhasil diperbarui!`);

      if (onSuccess) {
        onSuccess(updatedUser);
      }

      try {
        await refreshData();
      } catch {
        // ignore
      }

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menyimpan perubahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-spectrum-cyan/15 border border-spectrum-cyan/30 flex items-center justify-center text-spectrum-cyan">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Edit Akun Pengguna</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Perbarui profil hak akses sistem
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Email (Readonly) */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Alamat Email (Login)
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-slate-400 font-mono min-h-[44px]">
                <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{user.email}</span>
                <span className="ml-auto text-[10px] uppercase font-bold text-slate-500">
                  Tetap
                </span>
              </div>
            </div>

            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Nama Lengkap Pengguna *
              </label>
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Muhammad Farhan"
                className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Role / Hak Akses Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                Hak Akses (Role Sistem) *
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                disabled={isSelf && user.role === "administrator"}
                className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px] disabled:opacity-60"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value} className="bg-surface-2 text-white">
                    {r.label} — {r.desc}
                  </option>
                ))}
              </select>
              {isSelf && user.role === "administrator" && (
                <p className="text-[10px] text-amber-400 mt-1">
                  * Anda tidak dapat menurunkan hak akses administrator pada akun Anda sendiri.
                </p>
              )}
            </div>

            {/* Peminatan Divisi jika relevan */}
            {needsDivisi && (
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Penempatan Divisi *
                </label>
                <select
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value as DivisiName)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {DIVISI_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-surface-2 text-white">
                      Divisi {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-studio-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-text-secondary hover:text-white transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
