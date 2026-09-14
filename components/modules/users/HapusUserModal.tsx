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
  Copy,
  Check,
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
  const [needsMigration, setNeedsMigration] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  if (!isOpen || !user) return null;

  const isSelf = user.id === currentUser.id;

  const handleCopySQL = () => {
    const sql = `-- Eksekusi di Supabase Dashboard -> SQL Editor
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_actor_role TEXT;
    v_target_email TEXT;
    v_target_nama TEXT;
BEGIN
    SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
    IF auth.uid() IS NOT NULL AND (v_actor_role IS NULL OR v_actor_role NOT IN ('administrator', 'pembina')) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Akses ditolak: Hanya Administrator atau Dewan Pembina yang berhak menghapus akun.');
    END IF;

    IF target_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_user_id := target_identifier::UUID;
        SELECT email, nama INTO v_target_email, v_target_nama FROM public.profiles WHERE id = v_user_id;
    ELSE
        SELECT id, email, nama INTO v_user_id, v_target_email, v_target_nama FROM public.profiles WHERE lower(email) = lower(trim(target_identifier)) LIMIT 1;
        IF v_user_id IS NULL THEN
            SELECT id, email INTO v_user_id, v_target_email FROM auth.users WHERE lower(email) = lower(trim(target_identifier)) LIMIT 1;
        END IF;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Pengguna tidak ditemukan.');
    END IF;

    IF auth.uid() IS NOT NULL AND auth.uid() = v_user_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Tidak dapat menghapus akun sendiri yang sedang aktif.');
    END IF;

    UPDATE public.divisi_ref SET ketua_id = NULL WHERE ketua_id = v_user_id;
    UPDATE public.absensi SET libur_oleh = NULL WHERE libur_oleh = v_user_id;
    UPDATE public.absensi SET dicatat_oleh = NULL WHERE dicatat_oleh = v_user_id;
    UPDATE public.kas_settings SET diatur_oleh = NULL WHERE diatur_oleh = v_user_id;
    UPDATE public.kas_pembayaran SET dicatat_oleh = NULL WHERE dicatat_oleh = v_user_id;
    UPDATE public.keuangan_pembina SET created_by = NULL WHERE created_by = v_user_id;
    UPDATE public.notulen SET dibuat_oleh = NULL WHERE dibuat_oleh = v_user_id;
    UPDATE public.notulen SET disetujui_oleh = NULL WHERE disetujui_oleh = v_user_id;
    UPDATE public.agenda_foto SET dibuat_oleh = NULL WHERE dibuat_oleh = v_user_id;
    UPDATE public.agenda_foto SET diupdate_oleh = NULL WHERE diupdate_oleh = v_user_id;
    UPDATE public.inventaris SET penanggung_jawab = NULL WHERE penanggung_jawab = v_user_id;
    UPDATE public.inventaris_peminjaman SET dicatat_oleh = NULL WHERE dicatat_oleh = v_user_id;
    UPDATE public.laporan_arsip SET generated_by = NULL WHERE generated_by = v_user_id;
    UPDATE public.project SET penanggung_jawab = COALESCE(auth.uid(), (SELECT id FROM public.profiles WHERE role = 'administrator' LIMIT 1)) WHERE penanggung_jawab = v_user_id;
    UPDATE public.produksi_video SET uploaded_by = COALESCE(auth.uid(), (SELECT id FROM public.profiles WHERE role = 'administrator' LIMIT 1)) WHERE uploaded_by = v_user_id;
    UPDATE public.produksi_video SET approved_pembina_by = NULL WHERE approved_pembina_by = v_user_id;
    UPDATE public.produksi_video SET approved_ketua_by = NULL WHERE approved_ketua_by = v_user_id;
    UPDATE public.produksi_video SET penanggung_jawab_id = NULL WHERE penanggung_jawab_id = v_user_id;

    DELETE FROM public.profiles WHERE id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Akun berhasil dihapus permanen.', 'user_id', v_user_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, extensions AS $$
BEGIN
    RETURN public.admin_delete_user(target_user_id::TEXT);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_delete_user(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Profiles deletable by admin" ON public.profiles;
CREATE POLICY "Profiles deletable by admin" ON public.profiles FOR DELETE TO authenticated USING (public.get_current_role() IN ('administrator', 'pembina'));`;

    navigator.clipboard.writeText(sql);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  const handleDelete = async () => {
    if (isSelf) {
      setErrorMsg("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setNeedsMigration(false);

    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: user.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsMigration) {
          setNeedsMigration(true);
        }
        throw new Error(data.error || "Gagal menghapus akun pengguna dari database.");
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
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 space-y-2">
              <p>{errorMsg}</p>
              {needsMigration && (
                <div className="pt-2 border-t border-rose-500/20 space-y-2">
                  <p className="text-[11px] text-slate-300">
                    Supabase memerlukan fungsi SQL <code className="text-amber-400 bg-surface-3 px-1 py-0.5 rounded">admin_delete_user</code> untuk menghapus akun dan relasi data secara tuntas.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopySQL}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-white font-medium text-xs transition-colors"
                  >
                    {copiedSQL ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Query SQL Berhasil Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Salin Script SQL Penghapusan Akun</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    * Buka <strong>Supabase Dashboard &gt; SQL Editor &gt; New Query</strong>, tempel (paste), lalu klik <strong>Run</strong>.
                  </p>
                </div>
              )}
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
