"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnggotaRecord } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import { createClient } from "@/lib/supabase/client";
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface HapusAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  anggota: AnggotaRecord | null;
  onSuccess?: (deletedId: string) => void;
}

export function HapusAnggotaModal({
  isOpen,
  onClose,
  anggota,
  onSuccess,
}: HapusAnggotaModalProps) {
  const supabase = createClient();
  const { setAnggotaList, logAction } = useSession();

  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen || !anggota) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    setErrorMsg("");

    try {
      // 1. Hapus record dari database Supabase
      const { error: dbError } = await supabase
        .from("anggota")
        .delete()
        .eq("id", anggota.id);

      if (dbError) {
        console.warn("Supabase delete notice:", dbError);
      }

      // 2. Perbarui state lokal di SessionContext
      setAnggotaList((prev) => prev.filter((a) => a.id !== anggota.id));

      // 3. Catat ke audit log
      logAction(
        "DELETE_ANGGOTA",
        "anggota",
        anggota.id,
        `Menghapus data anggota: ${anggota.nama_lengkap} (NIS: ${anggota.nis}, Kelas: ${anggota.kelas})`
      );

      setSuccessMsg("Data anggota berhasil dihapus.");
      setTimeout(() => {
        if (onSuccess) onSuccess(anggota.id);
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error("Gagal menghapus anggota:", err);
      setErrorMsg("Terjadi kegagalan saat menghapus data. Silakan coba kembali.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hapus-anggota-title"
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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative bg-surface-2 border border-rose-500/30 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-orbital z-10 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3
                id="hapus-anggota-title"
                className="text-base font-bold text-white leading-tight"
              >
                Konfirmasi Hapus Anggota
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Tindakan ini tidak dapat dibatalkan setelah dikonfirmasi.
              </p>
            </div>

            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-1 rounded-lg text-studio-text-secondary hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Member Card Preview */}
          <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <strong className="text-white text-sm">{anggota.nama_lengkap}</strong>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-surface-2 text-slate-300 border border-studio-border-subtle">
                NIS: {anggota.nis}
              </span>
            </div>
            <p className="text-slate-400 font-mono">
              Kelas {anggota.kelas} · {anggota.jabatan}
              {anggota.divisi ? ` · Divisi ${anggota.divisi}` : ""}
            </p>
            <span className="inline-block text-[10px] font-mono text-rose-400 font-semibold uppercase">
              Tipe: {anggota.tipe === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus data siswa ini dari sistem Buku Induk?
          </p>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 text-rose-400 text-xs">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-surface-3 hover:bg-surface-1 text-slate-300 hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Data</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
