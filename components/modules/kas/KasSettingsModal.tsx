"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { kasSettingsSchema } from "@/lib/validations/kas";
import { formatIDR } from "@/lib/utils/currency";
import {
  X,
  Settings2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Users,
  Calendar,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KasSettingsModal({ isOpen, onClose }: KasSettingsModalProps) {
  const {
    currentUser,
    kasSettings,
    anggotaList,
    kasPembayaranList,
    refreshData,
    logAction,
    supabase,
  } = useSession();

  const [nominal, setNominal] = useState<number>(kasSettings.nominal);
  const [periodeType, setPeriodeType] = useState<"mingguan" | "dwimingguan" | "bulanan">(
    kasSettings.periode_type || "mingguan"
  );
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    kasSettings.effective_from || new Date().toISOString().split("T")[0]
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Loading & Applying State
  const [isApplying, setIsApplying] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [stepTitle, setStepTitle] = useState("");
  const [stepSubtitle, setStepSubtitle] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [affectedCount, setAffectedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = kasSettingsSchema.safeParse({
      nominal: Number(nominal),
      periode_type: periodeType,
      effective_from: effectiveFrom,
    });

    if (!result.success) {
      setErrorMsg(result.error.errors[0]?.message || "Input tidak valid");
      return;
    }

    try {
      setIsApplying(true);
      setCurrentStep(1);
      setProgressPercent(20);
      setStepTitle("Menyimpan Parameter Aturan Kas...");
      setStepSubtitle("Menulis konfigurasi tarif baru ke basis data studio...");

      // 1. Simpan ke kas_settings
      const { error: settingsError } = await supabase.from("kas_settings").insert({
        nominal: Number(nominal),
        periode_type: periodeType,
        effective_from: effectiveFrom,
        diatur_oleh: currentUser.id,
      });

      if (settingsError) {
        throw new Error(`Gagal menyimpan aturan kas: ${settingsError.message}`);
      }

      await new Promise((res) => setTimeout(res, 500));

      // 2. Identifikasi Anggota Tetap Aktif
      setCurrentStep(2);
      setProgressPercent(45);
      setStepTitle("Mendeteksi Register Anggota Tetap...");

      const activeTetapMembers = anggotaList.filter(
        (a) => a.tipe === "tetap" && a.status === "aktif"
      );
      const membersToProcess =
        activeTetapMembers.length > 0
          ? activeTetapMembers
          : anggotaList.filter((a) => a.status === "aktif");

      setAffectedCount(membersToProcess.length);
      setStepSubtitle(
        `Ditemukan ${membersToProcess.length} Anggota Tetap aktif untuk sinkronisasi.`
      );

      await new Promise((res) => setTimeout(res, 600));

      // 3. Menyesuaikan Periode & Tarif berdasarkan Tanggal Efektif
      setCurrentStep(3);
      setProgressPercent(75);
      setStepTitle("Menerapkan Aturan Sesuai Tanggal Efektif...");
      setStepSubtitle(
        `Menyesuaikan nominal ${formatIDR(nominal)} (${periodeType}) mulai ${effectiveFrom}...`
      );

      // A. Bersihkan tagihan belum lunas sebelum tanggal aturan ditentukan (misal: September)
      await supabase
        .from("kas_pembayaran")
        .delete()
        .lt("periode_start", effectiveFrom)
        .eq("status", "belum");

      // B. Bersihkan tagihan belum lunas untuk bulan-bulan mendatang (2 bulan ke depan: Nov, Des, Jan, dll)
      const effDate = new Date(effectiveFrom);
      const y = effDate.getFullYear();
      const m = effDate.getMonth() + 1;
      const lastDayOfCurMonth = new Date(y, m, 0).getDate();
      const endOfCurMonth = `${y}-${String(m).padStart(2, "0")}-${String(lastDayOfCurMonth).padStart(2, "0")}`;

      await supabase
        .from("kas_pembayaran")
        .delete()
        .gt("periode_start", endOfCurMonth)
        .eq("status", "belum");

      // C. Bersihkan tagihan belum lunas di bulan ini yang berformat lama/berbeda (agar W1..W4 dan D1..D2 tidak bercampur)
      const { data: curUnpaid } = await supabase
        .from("kas_pembayaran")
        .select("id, periode_label")
        .gte("periode_start", effectiveFrom)
        .lte("periode_start", endOfCurMonth)
        .eq("status", "belum");

      if (curUnpaid && curUnpaid.length > 0) {
        const idsToRemove: string[] = [];
        for (const item of curUnpaid) {
          const isBulananLabel = item.periode_label.toLowerCase().startsWith("bulan");
          const isDwimingguanLabel = item.periode_label.toUpperCase().startsWith("D");
          const isMingguanLabel = item.periode_label.toUpperCase().startsWith("W");

          if (periodeType === "bulanan" && !isBulananLabel) {
            idsToRemove.push(item.id);
          } else if (periodeType === "dwimingguan" && !isDwimingguanLabel) {
            idsToRemove.push(item.id);
          } else if (periodeType === "mingguan" && !isMingguanLabel) {
            idsToRemove.push(item.id);
          }
        }
        if (idsToRemove.length > 0) {
          for (let i = 0; i < idsToRemove.length; i += 100) {
            await supabase
              .from("kas_pembayaran")
              .delete()
              .in("id", idsToRemove.slice(i, i + 100));
          }
        }
      }

      // D. Generate HANYA periode aktif sampai hari ini / bulan berjalan ("mengikuti hari ini", TIDAK ADA 2 bulan ke depan)
      const today = new Date();
      const todayDate = today.getDate(); // 1 - 31
      const isCurrentMonth = today.getFullYear() === y && today.getMonth() + 1 === m;

      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "Mei",
        "Jun",
        "Jul",
        "Agu",
        "Sep",
        "Okt",
        "Nov",
        "Des",
      ];
      const mStr = monthNames[m - 1];
      const lastDay = new Date(y, m, 0).getDate();

      const generatedPeriods: Array<{
        start: string;
        end: string;
        label: string;
      }> = [];

      if (periodeType === "bulanan") {
        // Hanya 1 periode bulan berjalan
        generatedPeriods.push({
          start: `${y}-${String(m).padStart(2, "0")}-01`,
          end: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
          label: `Bulan ${mStr} ${y}`,
        });
      } else if (periodeType === "dwimingguan") {
        // D1: 01 - 14
        generatedPeriods.push({
          start: `${y}-${String(m).padStart(2, "0")}-01`,
          end: `${y}-${String(m).padStart(2, "0")}-14`,
          label: `D1 ${mStr} ${y}`,
        });
        // D2: 15 - lastDay (hanya jika sudah tanggal 15 ke atas atau lewat)
        if (!isCurrentMonth || todayDate >= 15) {
          generatedPeriods.push({
            start: `${y}-${String(m).padStart(2, "0")}-15`,
            end: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
            label: `D2 ${mStr} ${y}`,
          });
        }
      } else {
        // mingguan: W1, dan W2-W4 sesuai tanggal berjalan ("mengikuti hari ini")
        generatedPeriods.push({
          start: `${y}-${String(m).padStart(2, "0")}-01`,
          end: `${y}-${String(m).padStart(2, "0")}-07`,
          label: `W1 ${mStr}`,
        });
        if (!isCurrentMonth || todayDate >= 8) {
          generatedPeriods.push({
            start: `${y}-${String(m).padStart(2, "0")}-08`,
            end: `${y}-${String(m).padStart(2, "0")}-14`,
            label: `W2 ${mStr}`,
          });
        }
        if (!isCurrentMonth || todayDate >= 15) {
          generatedPeriods.push({
            start: `${y}-${String(m).padStart(2, "0")}-15`,
            end: `${y}-${String(m).padStart(2, "0")}-21`,
            label: `W3 ${mStr}`,
          });
        }
        if (!isCurrentMonth || todayDate >= 22) {
          generatedPeriods.push({
            start: `${y}-${String(m).padStart(2, "0")}-22`,
            end: `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`,
            label: `W4 ${mStr}`,
          });
        }
      }

      // Masukkan periode baru bagi anggota tetap
      const inserts: any[] = [];
      for (const mem of membersToProcess) {
        for (const p of generatedPeriods) {
          inserts.push({
            anggota_id: mem.id,
            periode_start: p.start,
            periode_end: p.end,
            periode_label: p.label,
            nominal: Number(nominal),
            status: "belum",
          });
        }
      }

      if (inserts.length > 0) {
        for (let i = 0; i < inserts.length; i += 100) {
          const chunk = inserts.slice(i, i + 100);
          await supabase
            .from("kas_pembayaran")
            .upsert(chunk, { onConflict: "anggota_id,periode_start" });
        }
      }

      await new Promise((res) => setTimeout(res, 600));

      // 4. Selesai
      setCurrentStep(4);
      setProgressPercent(100);
      setStepTitle("Aturan Kas Sukses Diterapkan!");
      setStepSubtitle(
        `Tarif ${formatIDR(nominal)} (${periodeType}) berhasil diterapkan ke ${membersToProcess.length} Anggota Tetap mulai ${effectiveFrom}.`
      );
      setIsCompleted(true);

      await refreshData();
      logAction(
        "UPDATE_KAS_RULES",
        "kas_settings",
        `Nominal: ${nominal}, Periode: ${periodeType}, Efektif: ${effectiveFrom}, Diterapkan ke ${membersToProcess.length} Anggota Tetap`
      );

      // Auto close setelah 1.5 detik
      setTimeout(() => {
        onClose();
        setIsApplying(false);
        setIsCompleted(false);
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Terjadi kesalahan: ${err.message || err}`);
      setIsApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (!isApplying) onClose();
          }}
          className="fixed inset-0 bg-cosmic/85 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-spectrum-amber" />
              <h3 id="settings-title" className="text-base font-bold text-white">
                Aturan Iuran Kas Anggota
              </h3>
            </div>
            {!isApplying && (
              <button
                onClick={onClose}
                aria-label="Tutup modal"
                className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mt-4 p-3 rounded-lg bg-spectrum-tangerine/15 border border-spectrum-tangerine/30 text-spectrum-tangerine text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* VIEW: Loading / Applying Progress Screen */}
          {isApplying ? (
            <div className="py-6 space-y-6 text-center">
              {/* Animated Progress Indicator */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 flex items-center justify-center mb-3">
                  <div className="absolute inset-0 rounded-full border-4 border-surface-3" />
                  <div
                    className="absolute inset-0 rounded-full border-4 border-spectrum-amber border-t-transparent animate-spin"
                    style={{ animationDuration: isCompleted ? "0s" : "1.2s" }}
                  />
                  {isCompleted ? (
                    <CheckCircle2 className="w-10 h-10 text-spectrum-jade animate-pulse" />
                  ) : (
                    <Layers className="w-8 h-8 text-spectrum-amber" />
                  )}
                </div>

                <h4 className="text-sm font-bold text-white tracking-wide">{stepTitle}</h4>
                <p className="text-xs text-studio-text-secondary mt-1 max-w-xs">{stepSubtitle}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-studio-text-muted">
                  <span>Progres Sinkronisasi</span>
                  <span className="font-bold text-spectrum-amber">{progressPercent}%</span>
                </div>
                <div className="w-full h-2 bg-surface-1 rounded-full overflow-hidden border border-studio-border-subtle">
                  <motion.div
                    className="h-full bg-gradient-to-r from-spectrum-amber to-spectrum-jade rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              </div>

              {/* 4-Step Checklist */}
              <div className="p-3.5 bg-surface-1 rounded-xl border border-studio-border-subtle text-left space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  {currentStep > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-spectrum-jade flex-shrink-0" />
                  ) : currentStep === 1 ? (
                    <Loader2 className="w-4 h-4 text-spectrum-amber animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-studio-border-medium flex-shrink-0" />
                  )}
                  <span className={currentStep >= 1 ? "text-white font-medium" : "text-studio-text-muted"}>
                    Simpan konfigurasi aturan kas
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentStep > 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-spectrum-jade flex-shrink-0" />
                  ) : currentStep === 2 ? (
                    <Loader2 className="w-4 h-4 text-spectrum-amber animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-studio-border-medium flex-shrink-0" />
                  )}
                  <span className={currentStep >= 2 ? "text-white font-medium" : "text-studio-text-muted"}>
                    Deteksi register Anggota Tetap ({affectedCount} siswa)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentStep > 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-spectrum-jade flex-shrink-0" />
                  ) : currentStep === 3 ? (
                    <Loader2 className="w-4 h-4 text-spectrum-amber animate-spin flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-studio-border-medium flex-shrink-0" />
                  )}
                  <span className={currentStep >= 3 ? "text-white font-medium" : "text-studio-text-muted"}>
                    Penyesuaian tarif mulai {effectiveFrom}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {currentStep >= 4 ? (
                    <CheckCircle2 className="w-4 h-4 text-spectrum-jade flex-shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-studio-border-medium flex-shrink-0" />
                  )}
                  <span className={currentStep >= 4 ? "text-spectrum-jade font-bold" : "text-studio-text-muted"}>
                    Sinkronisasi buku kas tuntas
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW: Form Configuration */
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="kas-nominal" className="block text-xs font-semibold text-white mb-1">
                  Nominal Iuran per Periode (Rp) *
                </label>
                <input
                  id="kas-nominal"
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={nominal}
                  onChange={(e) => setNominal(Number(e.target.value))}
                  placeholder="Contoh: 10000"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-sm font-mono text-white focus:border-spectrum-amber focus:outline-none min-h-[44px]"
                />
                <p className="text-[10px] font-mono text-studio-text-secondary mt-1">
                  Nominal tersimpan: {formatIDR(nominal)}
                </p>
              </div>

              <div>
                <label htmlFor="kas-periode-type" className="block text-xs font-semibold text-white mb-1">
                  Frekuensi Penarikan Kas *
                </label>
                <select
                  id="kas-periode-type"
                  value={periodeType}
                  onChange={(e) => setPeriodeType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-amber focus:outline-none min-h-[44px]"
                >
                  <option value="mingguan" className="bg-surface-2 text-white">
                    Mingguan (Tiap Akhir Pekan)
                  </option>
                  <option value="dwimingguan" className="bg-surface-2 text-white">
                    Dwimingguan (Tiap 2 Pekan)
                  </option>
                  <option value="bulanan" className="bg-surface-2 text-white">
                    Bulanan (Per Bulan / Tiap Awal Bulan)
                  </option>
                </select>
                <p className="text-[10px] font-mono text-studio-text-muted mt-1">
                  Pilih "Bulanan" untuk iuran yang ditarik 1 kali setiap awal bulan.
                </p>
              </div>

              <div>
                <label htmlFor="kas-effective" className="block text-xs font-semibold text-white mb-1">
                  Tanggal Mulai Berlaku (Tanggal Aturan Ditentukan) *
                </label>
                <input
                  id="kas-effective"
                  type="date"
                  required
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-amber focus:outline-none min-h-[44px] cursor-pointer"
                />
                <p className="text-[10px] font-mono text-studio-text-muted mt-1">
                  Semua periode pada atau setelah tanggal ini akan mengadopsi aturan &amp; tarif baru.
                </p>
              </div>

              {/* Informative Callout */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-orbital-violet/10 border border-orbital-violet/30 text-xs">
                <Users className="w-4 h-4 text-orbital-magenta flex-shrink-0 mt-0.5" />
                <p className="text-studio-text-secondary text-[11px] leading-relaxed">
                  Menyimpan aturan ini akan memicu proses sinkronisasi otomatis untuk seluruh{" "}
                  <strong className="text-white">Anggota Tetap</strong> terhitung mulai tanggal efektif di atas.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-surface-1 bg-spectrum-amber hover:bg-amber-400 rounded-lg transition-all shadow-amber min-h-[44px]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Simpan &amp; Terapkan Aturan</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
