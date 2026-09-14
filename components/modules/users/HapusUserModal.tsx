"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import {
  AlertTriangle,
  X,
  Trash2,
  Loader2,
  Mail,
  Shield,
  CheckCircle2,
} from "lucide-react";

interface HapusUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess?: (deletedUserId: string) => void;
}

export function HapusUserModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: HapusUserModalProps) {
  const { currentUser, setAllUsers, setPembinaList, logAction, refreshData } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUser.id;

  const handleDelete = async () => {
    if (isSelf) {
      setErrorMsg("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus akun pengguna.");
      }

      // Update state lokal
      setAllUsers((prev) => prev.filter((u) => u.id !== user.id));
      setPembinaList((prev) => prev.filter((p) => p.id !== user.id));

      logAction(
        "DELETE_USER",
        "profiles",
        user.id,
        `Menghapus akun pengguna: ${user.nama} (${user.email})`
      );

      setSuccessMsg(`Akun ${user.nama} berhasil dihapus.`);

      if (onSuccess) {
        onSuccess(user.id);
      }

      try {
        await refreshData();
      } catch {
        // ignore
      }

      setTimeout(() => {
        onClose();
      }, 750);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menghapus pengguna.");
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
          className="relative bg-surface-2 border border-rose-500/30 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-studio-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Hapus Akun Pengguna</h3>
                <p className="text-xs text-rose-400/90 font-mono">
                  Tindakan ini tidak dapat dibatalkan
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
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* User Preview Box */}
          <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nama:</span>
              <strong className="text-white text-sm">{user.nama}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="text-slate-300 font-mono text-[11px]">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Role Sistem:</span>
              <span className="px-2 py-0.5 rounded bg-surface-2 text-white font-mono text-[11px] font-bold uppercase">
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
            {user.divisi && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Divisi:</span>
                <span className="text-spectrum-cyan font-mono text-[11px]">{user.divisi}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Apakah Anda yakin ingin menghapus akun pengguna ini? Pengguna tidak akan dapat lagi masuk ke sistem Broadcast Spensa OS.
          </p>

          {isSelf && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300">
              * Anda tidak diizinkan menghapus akun Anda sendiri saat sedang masuk.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-text-secondary hover:text-white transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading || isSelf}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-rose-900/30 min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Akun</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
