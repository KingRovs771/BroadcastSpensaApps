"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, DivisiName, AnggotaRecord } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import { createClient } from "@/lib/supabase/client";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import {
  X,
  GraduationCap,
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Hash,
  Phone,
  UserCheck,
} from "lucide-react";

interface JadikanAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSuccess?: (newAnggota: AnggotaRecord) => void;
}

const TINGKAT_KELAS_OPTIONS = ["VII", "VIII", "IX"] as const;
const ROMBEL_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"] as const;

export function JadikanAnggotaModal({
  isOpen,
  onClose,
  user,
  onSuccess,
}: JadikanAnggotaModalProps) {
  const { setAnggotaList, logAction, refreshData } = useSession();
  const supabase = createClient();

  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [tingkatKelas, setTingkatKelas] = useState<"VII" | "VIII" | "IX">("VIII");
  const [rombelKelas, setRombelKelas] = useState<string>("B");
  const [jabatan, setJabatan] = useState("Anggota");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [noHp, setNoHp] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Inisialisasi data dari profil user saat modal dibuka
  useEffect(() => {
    if (user && isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setNis("");
      setNisn("");
      setNoHp("");

      // Petakan jabatan dari peran user
      let mappedJabatan = "Anggota";
      if (user.role === "ketua_broadcast") mappedJabatan = "Ketua Umum Broadcast";
      else if (user.role === "ketua_divisi") mappedJabatan = "Ketua Divisi";
      else if (user.role === "sekretaris") mappedJabatan = "Sekretaris";
      else if (user.role === "bendahara") mappedJabatan = "Bendahara";
      else if (user.role === "div_kreatif") mappedJabatan = "Staf Divisi Kreatif";
      else if (user.role === "pj") mappedJabatan = "Penanggung Jawab (PJ)";
      else if (user.role === "administrator") mappedJabatan = "Administrator";
      setJabatan(mappedJabatan);

      if (user.divisi) {
        setDivisi(user.divisi);
      }
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nis.trim()) {
      setErrorMsg("NIS (Nomor Induk Siswa) wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const kelasLengkap = `${tingkatKelas}-${rombelKelas}`;

      const newAnggotaPayload = {
        tipe: "tetap" as const,
        nama_lengkap: user.nama.trim(),
        nis: nis.trim(),
        nisn: nisn.trim() || null,
        kelas: kelasLengkap,
        jabatan: jabatan.trim(),
        divisi: divisi || null,
        tahun_ajaran: "2026/2027",
        status: "aktif" as const,
        no_hp: noHp.trim() || null,
      };

      // 1. Simpan ke Supabase public.anggota via upsert (onConflict: nis)
      const { data, error } = await supabase
        .from("anggota")
        .upsert(newAnggotaPayload, { onConflict: "nis" })
        .select()
        .single();

      if (error) {
        throw new Error(error.message || "Gagal mendaftarkan ke database anggota.");
      }

      const createdAnggota = data as AnggotaRecord;

      // 2. Update state lokal dan audit log
      setAnggotaList((prev) => {
        const filtered = prev.filter((a) => a.nis !== createdAnggota.nis);
        return [...filtered, createdAnggota];
      });

      logAction(
        "REGISTER_ANGGOTA_FROM_USER",
        "anggota",
        createdAnggota.id,
        `Mendaftarkan pengguna ${user.nama} (${user.email}) sebagai Anggota Tetap Kelas ${kelasLengkap}`
      );

      await refreshData();
      if (onSuccess) onSuccess(createdAnggota);

      setSuccessMsg(`Berhasil! ${user.nama} kini telah terdaftar sebagai Anggota Tetap.`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data.";
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
        aria-labelledby="jadikan-anggota-title"
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
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 pb-3 border-b border-studio-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 id="jadikan-anggota-title" className="text-base font-bold text-white leading-tight">
                  Jadikan Anggota Tetap
                </h3>
                <p className="text-xs text-studio-text-secondary mt-0.5">
                  Daftarkan akun <strong className="text-white font-semibold">{user.nama}</strong> ke Buku Induk Anggota Tetap
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isLoading}
              aria-label="Tutup modal"
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert Error / Success */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Ringkasan Profil Pengguna */}
          <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nama Pengguna:</span>
              <span className="text-white font-bold">{user.nama}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Email Akun:</span>
              <span className="font-mono text-slate-300">{user.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Peran Sistem:</span>
              <span className="text-cyan-400 font-semibold capitalize font-mono text-[11px]">
                {user.role.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {/* Form Input Data Anggota */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Kelas Siswa */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1.5">
                Kelas Siswa *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={tingkatKelas}
                  onChange={(e) => setTingkatKelas(e.target.value as "VII" | "VIII" | "IX")}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {TINGKAT_KELAS_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-[#0B132B]">
                      Kelas {t}
                    </option>
                  ))}
                </select>
                <select
                  value={rombelKelas}
                  onChange={(e) => setRombelKelas(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {ROMBEL_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-[#0B132B]">
                      Ruang {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* NIS & NISN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  NIS (Nomor Induk Siswa) *
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="Contoh: 16351"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white placeholder:text-slate-500 focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  NISN (Opsional)
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nisn}
                    onChange={(e) => setNisn(e.target.value)}
                    placeholder="Contoh: 0125010661"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white placeholder:text-slate-500 focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            {/* Divisi & Jabatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Divisi Broadcast *
                </label>
                <select
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value as DivisiName)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {DIVISI_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-[#0B132B]">
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Jabatan Organisasi *
                </label>
                <input
                  type="text"
                  required
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  placeholder="Contoh: Ketua Divisi"
                  className="w-full px-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-white mb-1">
                No. WhatsApp / HP (Opsional)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="081234567890"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white placeholder:text-slate-500 focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Tombol Simpan */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[42px]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 rounded-xl transition-all shadow-cyan min-h-[42px] flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Simpan Anggota Tetap</span>
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
