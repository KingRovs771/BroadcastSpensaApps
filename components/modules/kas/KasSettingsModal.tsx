"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { kasSettingsSchema } from "@/lib/validations/kas";
import { formatIDR } from "@/lib/utils/currency";
import { X, Settings2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface KasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KasSettingsModal({ isOpen, onClose }: KasSettingsModalProps) {
  const { kasSettings, setKasSettings, logAction } = useSession();

  const [nominal, setNominal] = useState<number>(kasSettings.nominal);
  const [periodeType, setPeriodeType] = useState<"mingguan" | "dwimingguan">(
    kasSettings.periode_type
  );
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    kasSettings.effective_from
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = kasSettingsSchema.safeParse({
      nominal: Number(nominal),
      periode_type: periodeType,
      effective_from: effectiveFrom,
    });

    if (!result.success) {
      setErrorMsg(result.error.errors[0]?.message || "Input tidak valid");
      return;
    }

    setKasSettings({
      nominal: Number(nominal),
      periode_type: periodeType,
      effective_from: effectiveFrom,
    });

    logAction(
      "UPDATE_KAS_RULES",
      "kas_settings",
      `Nominal: ${nominal}, Periode: ${periodeType}, Efektif: ${effectiveFrom}`
    );

    onClose();
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
          onClick={onClose}
          className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital z-10"
        >
        <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-spectrum-amber" />
            <h3 id="settings-title" className="text-base font-bold text-white">
              Aturan Iuran Kas Anggota
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-spectrum-tangerine/15 border border-spectrum-tangerine/30 text-spectrum-tangerine text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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
            </select>
          </div>

          <div>
            <label htmlFor="kas-effective" className="block text-xs font-semibold text-white mb-1">
              Tanggal Mulai Berlaku *
            </label>
            <input
              id="kas-effective"
              type="date"
              required
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-amber focus:outline-none min-h-[44px]"
            />
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
              className="px-5 py-2 text-xs font-bold text-surface-1 bg-spectrum-amber hover:bg-amber-400 rounded-lg transition-all shadow-amber min-h-[44px]"
            >
              Simpan Aturan Kas
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
