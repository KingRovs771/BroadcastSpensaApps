"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnggotaRecord, DivisiName } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import { createClient } from "@/lib/supabase/client";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import {
  X,
  User,
  GraduationCap,
  Award,
  Phone,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface EditAnggotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  anggota: AnggotaRecord | null;
  onSuccess?: (updated: AnggotaRecord) => void;
}

const TINGKAT_KELAS_OPTIONS = ["VII", "VIII", "IX"] as const;
const ROMBEL_OPTIONS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"
] as const;

const JABATAN_ROLE_OPTIONS = [
  "Anggota",
  "Ketua Umum Broadcast",
  "Wakil Ketua Broadcast",
  "Ketua Divisi",
  "Sekretaris 1",
  "Sekretaris 2",
  "Bendahara 1",
  "Bendahara 2",
  "Penanggung Jawab (PJ)",
  "Staf Divisi Kreatif",
  "Staf Teknis Studio",
] as const;

export function EditAnggotaModal({
  isOpen,
  onClose,
  anggota,
  onSuccess,
}: EditAnggotaModalProps) {
  const supabase = createClient();
  const { setAnggotaList, logAction } = useSession();

  const [namaLengkap, setNamaLengkap] = useState("");
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [tingkatKelas, setTingkatKelas] = useState<"VII" | "VIII" | "IX">("VIII");
  const [rombelKelas, setRombelKelas] = useState("A");
  const [jabatan, setJabatan] = useState("Anggota");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [tipe, setTipe] = useState<"tetap" | "ekskul">("tetap");
  const [status, setStatus] = useState<"aktif" | "cuti" | "lulus" | "nonaktif">("aktif");
  const [noHp, setNoHp] = useState("");
  const [catatan, setCatatan] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sinkronkan state form saat anggota berubah
  useEffect(() => {
    if (anggota) {
      setNamaLengkap(anggota.nama_lengkap || "");
      setNis(anggota.nis || "");
      setNisn(anggota.nisn || "");

      // Parse format kelas (misal "VIII-C" atau "IX-A")
      if (anggota.kelas) {
        const parts = anggota.kelas.split("-");
        if (parts.length >= 2) {
          const t = parts[0].trim() as "VII" | "VIII" | "IX";
          if (["VII", "VIII", "IX"].includes(t)) {
            setTingkatKelas(t);
          }
          setRombelKelas(parts[1].trim() || "A");
        }
      }

      setJabatan(anggota.jabatan || "Anggota");
      setDivisi(anggota.divisi || "Broadcasting");
      setTipe(anggota.tipe || "tetap");
      setStatus(anggota.status || "aktif");
      setNoHp(anggota.no_hp || "");
      setCatatan(anggota.catatan || "");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [anggota]);

  if (!isOpen || !anggota) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaLengkap.trim() || !nis.trim()) {
      setErrorMsg("Nama lengkap dan NIS wajib diisi.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const finalKelas = `${tingkatKelas}-${rombelKelas}`;
    const updatedAnggota: AnggotaRecord = {
      ...anggota,
      nama_lengkap: namaLengkap.trim(),
      nis: nis.trim(),
      nisn: nisn.trim() || undefined,
      kelas: finalKelas,
      jabatan: jabatan.trim(),
      divisi: tipe === "tetap" ? divisi : undefined,
      tipe,
      status,
      no_hp: noHp.trim() || undefined,
      catatan: catatan.trim() || undefined,
    };

    try {
      // 1. Update ke Supabase
      const { error: dbError } = await supabase
        .from("anggota")
        .update({
          nama_lengkap: updatedAnggota.nama_lengkap,
          nis: updatedAnggota.nis,
          nisn: updatedAnggota.nisn || null,
          kelas: updatedAnggota.kelas,
          jabatan: updatedAnggota.jabatan,
          divisi: updatedAnggota.divisi || null,
          tipe: updatedAnggota.tipe,
          status: updatedAnggota.status,
          no_hp: updatedAnggota.no_hp || null,
          catatan: updatedAnggota.catatan || null,
        })
        .eq("id", anggota.id);

      if (dbError) {
        console.warn("Supabase update notice:", dbError);
      }

      // 2. Update state lokal
      setAnggotaList((prev) =>
        prev.map((a) => (a.id === anggota.id ? updatedAnggota : a))
      );

      // 3. Catat audit log
      logAction(
        "UPDATE_ANGGOTA",
        "anggota",
        anggota.id,
        `Memperbarui data siswa: ${updatedAnggota.nama_lengkap} (${updatedAnggota.kelas}) - ${updatedAnggota.jabatan}`
      );

      setSuccessMsg("Data anggota berhasil diperbarui!");
      setTimeout(() => {
        if (onSuccess) onSuccess(updatedAnggota);
        onClose();
      }, 700);
    } catch (err: unknown) {
      console.error("Error updating anggota:", err);
      setErrorMsg("Terjadi kegagalan saat menyimpan data. Periksa koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-anggota-title"
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
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-lg w-full p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10 space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
            <div>
              <h3
                id="edit-anggota-title"
                className="text-base font-bold text-white flex items-center gap-2"
              >
                <span>Edit Data Anggota Siswa</span>
              </h3>
              <p className="text-[11px] text-studio-text-secondary mt-0.5 font-mono">
                ID: {anggota.id} · Terdaftar sebagai {anggota.tipe.toUpperCase()}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-white font-semibold mb-1">
                Nama Lengkap Siswa *
              </label>
              <input
                type="text"
                required
                value={namaLengkap}
                onChange={(e) => setNamaLengkap(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>

            {/* NIS & NISN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-semibold mb-1">
                  Nomor Induk Siswa (NIS) *
                </label>
                <input
                  type="text"
                  required
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">
                  NISN (Opsional)
                </label>
                <input
                  type="text"
                  value={nisn}
                  onChange={(e) => setNisn(e.target.value)}
                  placeholder="0081234567"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            {/* Kelas: Tingkat & Rombel */}
            <div>
              <label className="block text-white font-semibold mb-1">
                Kelas (Tingkat &amp; Rombel) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Tingkat Kelas"
                  value={tingkatKelas}
                  onChange={(e) => setTingkatKelas(e.target.value as "VII" | "VIII" | "IX")}
                  className="w-full px-2.5 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {TINGKAT_KELAS_OPTIONS.map((t) => (
                    <option key={t} value={t} className="bg-surface-2 text-white">
                      Kelas {t}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Rombel Kelas"
                  value={rombelKelas}
                  onChange={(e) => setRombelKelas(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {ROMBEL_OPTIONS.map((r) => (
                    <option key={r} value={r} className="bg-surface-2 text-white">
                      Ruang {r}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[10px] font-mono text-slate-400 mt-1">
                Kombinasi aktif: <strong className="text-spectrum-cyan">{tingkatKelas}-{rombelKelas}</strong>
              </p>
            </div>

            {/* Jabatan Struktural & Divisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-semibold mb-1">
                  Jabatan Struktural
                </label>
                <select
                  value={jabatan}
                  onChange={(e) => setJabatan(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {JABATAN_ROLE_OPTIONS.map((j) => (
                    <option key={j} value={j} className="bg-surface-2 text-white">
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">
                  Divisi (Khusus Anggota Tetap)
                </label>
                <select
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value as DivisiName)}
                  disabled={tipe === "ekskul"}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px] disabled:opacity-40"
                >
                  {DIVISI_OPTIONS.map((d) => (
                    <option key={d} value={d} className="bg-surface-2 text-white">
                      Divisi {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tipe Keanggotaan & Status Siswa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-white font-semibold mb-1">
                  Tipe Keanggotaan
                </label>
                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value as "tetap" | "ekskul")}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  <option value="tetap" className="bg-surface-2 text-white">
                    Anggota Tetap (Buku Induk)
                  </option>
                  <option value="ekskul" className="bg-surface-2 text-white">
                    Anggota Ekskul
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-white font-semibold mb-1">
                  Status Siswa
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "aktif" | "cuti" | "lulus" | "nonaktif")}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  <option value="aktif" className="bg-surface-2 text-white">Aktif</option>
                  <option value="cuti" className="bg-surface-2 text-white">Cuti</option>
                  <option value="lulus" className="bg-surface-2 text-white">Lulus / Alumni</option>
                  <option value="nonaktif" className="bg-surface-2 text-white">Nonaktif</option>
                </select>
              </div>
            </div>

            {/* Nomor WhatsApp */}
            <div>
              <label className="block text-white font-semibold mb-1">
                Nomor WhatsApp Siswa
              </label>
              <input
                type="tel"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
                placeholder="081234567890"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-white font-semibold mb-1">
                Catatan Khusus (Opsional)
              </label>
              <textarea
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Catatan prestasi, minat khusus, atau tugas operasional..."
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-white focus:border-spectrum-cyan focus:outline-none resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-xl bg-surface-3 hover:bg-surface-1 text-slate-300 hover:text-white transition-colors min-h-[44px]"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink font-bold transition-all shadow-cyan flex items-center gap-2 min-h-[44px] disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
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
