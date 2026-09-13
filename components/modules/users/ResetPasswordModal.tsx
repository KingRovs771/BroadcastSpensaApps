"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import {
  Key,
  X,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  Copy,
  Check,
  Mail,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldAlert,
  Database,
} from "lucide-react";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess?: () => void;
}

export function ResetPasswordModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: ResetPasswordModalProps) {
  const { logAction, currentUser } = useSession();

  const [mode, setMode] = useState<"direct" | "email">("direct");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedCredentials, setCopiedCredentials] = useState(false);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState(false);

  if (!isOpen || !user) return null;

  // Generator kata sandi acak aman
  const handleGeneratePassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let rand = "";
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const generated = `Spensa${new Date().getFullYear()}!${rand}`;
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
  };

  const handleCopyCredentials = () => {
    if (!newPassword) return;
    const text = `Akun Broadcast Spensa OS\nEmail: ${user.email}\nKata Sandi Baru: ${newPassword}\nHarap segera login dan simpan kredensial Anda.`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 2500);
  };

  const handleCopySQL = () => {
    const sql = `-- Salin dan jalankan di SQL Editor Supabase:
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_reset_password(
    target_email TEXT,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    IF new_password IS NULL OR length(new_password) < 6 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Kata sandi baru minimal 6 karakter.');
    END IF;

    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = lower(trim(target_email))
    LIMIT 1;

    IF v_user_id IS NULL THEN
        SELECT id::UUID INTO v_user_id
        FROM public.profiles
        WHERE lower(email) = lower(trim(target_email))
          AND id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        LIMIT 1;
    END IF;

    IF v_user_id IS NULL THEN
        v_user_id := extensions.gen_random_uuid();
    END IF;

    v_encrypted_pw := extensions.crypt(new_password, extensions.gen_salt('bf'));

    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_user_id OR lower(email) = lower(trim(target_email));

    IF NOT FOUND THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            lower(trim(target_email)),
            v_encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Kata sandi berhasil direset.'
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_reset_password(TEXT, TEXT) TO anon, authenticated, service_role;`;

    navigator.clipboard.writeText(sql);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setNeedsMigration(false);

    if (mode === "direct") {
      if (!newPassword) {
        setErrorMsg("Kata sandi baru wajib diisi.");
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg("Kata sandi minimal 6 karakter.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg("Konfirmasi kata sandi tidak cocok.");
        return;
      }
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          newPassword: mode === "direct" ? newPassword : undefined,
          mode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.needsMigration) {
          setNeedsMigration(true);
        }
        throw new Error(data.error || "Gagal mereset kata sandi.");
      }

      // Catat ke audit log
      logAction(
        "RESET_PASSWORD",
        "profiles",
        user.id,
        `Mereset kata sandi akun ${user.nama} (${user.email}) menggunakan mode: ${mode === "direct" ? "Penetapan Langsung" : "Tautan Email"}`
      );

      setSuccessMsg(data.message || "Kata sandi berhasil diperbarui.");

      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error("Error resetting password:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat memproses reset.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-pwd-title"
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

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-amber-500/35 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-orbital overflow-y-auto max-h-[92vh] z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-studio-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3
                  id="reset-pwd-title"
                  className="text-base font-bold text-white leading-tight"
                >
                  Reset Kata Sandi Pengguna
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Otoritas khusus Administrator &amp; Dewan Pembina
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Target Banner */}
          <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              <strong className="text-white block truncate">{user.nama}</strong>
              <span className="text-slate-400 font-mono text-[11px] block truncate">{user.email}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase shrink-0">
              {user.role.replace(/_/g, " ")}
            </span>
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-1 rounded-xl border border-studio-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                mode === "direct"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sandi Baru Langsung</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("email")}
              className={`py-2 px-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[40px] ${
                mode === "email"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Kirim Link Email</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {needsMigration && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Database className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Solusi Cepat untuk Reset Langsung:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-studio-text-secondary">
                Supabase secara default membatasi penggantian password antar pengguna tanpa service role key. Anda dapat mengaktifkannya sekali saja dengan menjalankan query RPC di <strong>Supabase SQL Editor</strong>:
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopySQL}
                  className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition min-h-[38px]"
                >
                  {copiedSQL ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Query SQL Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Query SQL Pengaktif</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("email");
                    setErrorMsg("");
                    setNeedsMigration(false);
                  }}
                  className="px-3 py-2 rounded-lg bg-surface-3 hover:bg-surface-1 text-white border border-studio-border-medium text-[11px] font-semibold flex items-center justify-center gap-1.5 transition min-h-[38px]"
                >
                  <Mail className="w-3.5 h-3.5 text-spectrum-cyan" />
                  <span>Atau Gunakan Kirim Link Email</span>
                </button>
              </div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === "direct" ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-white font-semibold">
                      Kata Sandi Baru *
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Buat Acak Aman</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter..."
                      className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-surface-1 border border-studio-border-subtle font-mono text-white text-xs focus:border-amber-400 focus:outline-none min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                      aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-white font-semibold mb-1">
                    Konfirmasi Kata Sandi Baru *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru..."
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-1 border border-studio-border-subtle font-mono text-white text-xs focus:border-amber-400 focus:outline-none min-h-[44px]"
                  />
                </div>

                {newPassword && (
                  <div className="p-2.5 rounded-xl bg-surface-1 border border-studio-border-subtle flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 truncate">
                      Kredensial siap diserahkan ke pengguna
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCredentials}
                      className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-amber-300 text-[10px] font-bold border border-studio-border-subtle flex items-center gap-1 shrink-0 min-h-[32px]"
                    >
                      {copiedCredentials ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Kredensial</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Mail className="w-4 h-4" />
                  <strong className="text-xs">Tautan Pemulihan Kata Sandi</strong>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sistem akan mengirimkan email resmi berisi tautan khusus kepada{" "}
                  <strong className="text-white">{user.email}</strong> untuk mengatur ulang kata sandi secara mandiri.
                </p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 sm:gap-3 pt-3 border-t border-studio-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-surface-3 hover:bg-surface-1 text-slate-300 hover:text-white transition-colors min-h-[44px] font-semibold"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-ink font-bold transition-all shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>
                      {mode === "direct" ? "Tetapkan Kata Sandi" : "Kirim Link Email"}
                    </span>
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
