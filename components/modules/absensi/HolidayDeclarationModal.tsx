"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { holidayDeclarationSchema } from "@/lib/validations/absensi";
import { X, CalendarOff, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface HolidayDeclarationModalProps {
  currentDate: string;
  isOpen: boolean;
  onClose: () => void;
  onDeclared: (alasan: string) => void;
}

export function HolidayDeclarationModal({
  currentDate,
  isOpen,
  onClose,
  onDeclared,
}: HolidayDeclarationModalProps) {
  const [alasan, setAlasan] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const validation = holidayDeclarationSchema.safeParse({
      tanggal: currentDate,
      alasan,
    });

    if (!validation.success) {
      setErrorMsg(validation.error.errors[0]?.message || "Validasi gagal");
      return;
    }

    onDeclared(alasan);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="holiday-modal-title"
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
              <CalendarOff className="w-5 h-5 text-spectrum-amber" />
              <h3 id="holiday-modal-title" className="text-base font-bold text-white">
                Deklarasi Pekan Libur Resmi
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
          <p className="text-xs text-studio-text-secondary leading-relaxed">
            Menetapkan sesi tanggal <strong className="text-white">{currentDate}</strong> sebagai hari libur resmi. Sesi libur dikecualikan dari akumulasi persentase kehadiran dan mencegah sanksi alpha.
          </p>

          <div>
            <label htmlFor="alasan-libur" className="block text-xs font-semibold text-white mb-1">
              Alasan Libur Resmi *
            </label>
            <textarea
              id="alasan-libur"
              rows={3}
              required
              value={alasan}
              onChange={(e) => setAlasan(e.target.value)}
              placeholder="Contoh: Masa Penilaian Akhir Semester (PAS) Ganjil 2026 / Libur Nasional Maulid Nabi"
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-amber focus:outline-none"
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
              Tetapkan Libur Resmi
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
