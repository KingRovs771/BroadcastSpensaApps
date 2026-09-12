"use client";

import React, { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/shared/SessionContext";
import { UserProfile } from "@/lib/mock/store";
import {
  X,
  UserCheck,
  Mail,
  Lock,
  Phone,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TambahPembinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPembina: UserProfile) => void;
}

export function TambahPembinaModal({
  isOpen,
  onClose,
  onSuccess,
}: TambahPembinaModalProps) {
  const supabase = createClient();
  const { logAction, refreshData } = useSession();

  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [jabatanSekolah, setJabatanSekolah] = useState("Guru Pembina Ekskul");
  const [noHp, setNoHp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nama.trim() || !email.trim() || !password) {
      setErrorMsg("Nama lengkap, email, dan kata sandi wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Daftarkan akun baru ke Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            nama: nama.trim(),
            role: "pembina",
            nip: nip.trim() || undefined,
            jabatan: jabatanSekolah.trim(),
            no_hp: noHp.trim() || undefined,
          },
        },
      });

      if (authError) {
        // Jika email sudah terdaftar, coba tambahkan langsung ke profiles
        if (authError.message.includes("User already registered")) {
          setErrorMsg("Email ini sudah terdaftar di sistem. Gunakan email lain.");
          setIsLoading(false);
          return;
        }
        throw authError;
      }

      const userId = authData.user?.id || `pem-${Date.now()}`;

      // 2. Simpan atau pastikan profil Pembina ada di public.profiles
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          role: "pembina",
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.warn("Profil auto-insert notice:", profileError);
      }

      // 3. Catat audit log
      logAction(
        "REGISTER_PEMBINA",
        "profiles",
        userId,
        `Menambahkan Dewan Pembina: ${nama.trim()} (${jabatanSekolah})`
      );

      const newPembinaProfile: UserProfile = {
        id: userId,
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        role: "pembina",
      };

      if (onSuccess) {
        onSuccess(newPembinaProfile);
      }

      await refreshData();

      setSuccessMsg(
        `Berhasil mendaftarkan Pembina: ${nama}. Akun dapat langsung digunakan untuk login monitoring center.`
      );

      // Reset form
      setNama("");
      setNip("");
      setEmail("");
      setPassword("");
      setNoHp("");

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1600);
    } catch (err: unknown) {
      console.error("Error creating pembina:", err);
      const msg = err instanceof Error ? err.message : "Gagal menambahkan pembina.";
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-[#0B132B] border border-violet-500/30 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
        >
          {/* Top accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-400" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Tambah Dewan Pembina
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Broadcast Spensa OS · Akses Monitoring & Approval
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="overflow-y-auto pr-1 mt-4 space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form id="form-tambah-pembina" onSubmit={handleSubmit} className="space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Nama Lengkap & Gelar Pembina *
                </label>
                <div className="relative group">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Contoh: Dra. Hj. Siti Rahmah, M.Pd"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* NIP & Jabatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    NIP / NUPTK (Opsional)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder="197804122005012008"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Jabatan Guru / Pembina *
                  </label>
                  <div className="relative group">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                    <input
                      type="text"
                      required
                      value={jabatanSekolah}
                      onChange={(e) => setJabatanSekolah(e.target.value)}
                      placeholder="Guru Pembina Utama"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Email Akun Pembina *
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="pembina@spensa.sch.id"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Kata Sandi Awal *
                  </label>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* No. WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  No. WhatsApp / HP Pembina (Opsional)
                </label>
                <div className="relative group">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/30 text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong className="text-violet-300">Hak Akses Pembina:</strong> Memiliki wewenang mengesahkan Naskah Gate 1, menyetujui anggaran dana BOS/Sponsor, serta monitoring laporan semester.
              </div>
            </form>
          </div>

          {/* Footer Action */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              form="form-tambah-pembina"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition-all flex items-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan Pembina...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Daftarkan Pembina</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
