"use client";

import React, { useState } from "react";
import { InventarisItem, InventarisPeminjaman } from "@/lib/mock/store";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, X, AlertTriangle, ArrowDownLeft, Loader2 } from "lucide-react";

interface ReturnInventarisModalProps {
  isOpen: boolean;
  item: InventarisItem | null;
  activeLoan?: InventarisPeminjaman | null;
  onClose: () => void;
  onConfirmReturn: (
    item: InventarisItem,
    returnKondisi: "baik" | "rusak ringan" | "rusak berat" | "hilang",
    catatan?: string
  ) => Promise<void>;
}

export function ReturnInventarisModal({
  isOpen,
  item,
  activeLoan,
  onClose,
  onConfirmReturn,
}: ReturnInventarisModalProps) {
  const [returnKondisi, setReturnKondisi] = useState<
    "baik" | "rusak ringan" | "rusak berat" | "hilang"
  >("baik");
  const [catatan, setCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirmReturn(item, returnKondisi, catatan.trim() || undefined);
      setCatatan("");
      setReturnKondisi("baik");
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const kondisiOptions: Array<{
    value: "baik" | "rusak ringan" | "rusak berat" | "hilang";
    label: string;
    desc: string;
    colorClass: string;
  }> = [
    {
      value: "baik",
      label: "Kondisi Baik",
      desc: "Perangkat berfungsi normal, fisik bersih & lengkap",
      colorClass:
        "border-spectrum-jade/40 hover:border-spectrum-jade bg-spectrum-jade/10 text-spectrum-jade",
    },
    {
      value: "rusak ringan",
      label: "Rusak Ringan",
      desc: "Ada goresan kecil atau kendala minor namun masih dapat dipakai",
      colorClass:
        "border-spectrum-amber/40 hover:border-spectrum-amber bg-spectrum-amber/10 text-spectrum-amber",
    },
    {
      value: "rusak berat",
      label: "Rusak Berat",
      desc: "Malfungsi total, pecah, atau tidak dapat dihidupkan",
      colorClass:
        "border-spectrum-crimson/40 hover:border-spectrum-crimson bg-spectrum-crimson/10 text-spectrum-crimson",
    },
    {
      value: "hilang",
      label: "Hilang",
      desc: "Aset tidak dapat ditemukan atau tertinggal di lokasi luar",
      colorClass:
        "border-red-600/40 hover:border-red-500 bg-red-600/10 text-red-400",
    },
  ];

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
            <div className="flex items-center gap-2 text-spectrum-jade">
              <div className="p-2 rounded-xl bg-spectrum-jade/10 border border-spectrum-jade/20">
                <ArrowDownLeft className="w-5 h-5 text-spectrum-jade" />
              </div>
              <div>
                <h3 id="return-modal-title" className="text-base font-bold text-white">
                  Pengembalian Aset Studio
                </h3>
                <p className="text-[11px] font-mono text-studio-text-muted">
                  Konfirmasi penerimaan & inspeksi kondisi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Tutup modal"
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Asset Info Card */}
            <div className="p-3 bg-surface-1 rounded-xl border border-studio-border-subtle space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-spectrum-cyan font-bold">{item.kode_inventaris}</span>
                <span className="text-studio-text-muted">{item.kategori}</span>
              </div>
              <p className="text-sm font-bold text-white font-sans">{item.nama_barang}</p>
              {item.peminjam_nama && (
                <div className="text-[11px] text-spectrum-amber pt-1 border-t border-studio-border-subtle">
                  Peminjam Terdaftar: <strong>{item.peminjam_nama}</strong>
                </div>
              )}
            </div>

            {/* Kondisi Radio Options */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-white">
                Kondisi Fisik Saat Diterima Kembali *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {kondisiOptions.map((opt) => {
                  const isSelected = returnKondisi === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReturnKondisi(opt.value)}
                      className={`text-left p-2.5 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? `${opt.colorClass} ring-2 ring-spectrum-cyan/50`
                          : "border-studio-border-subtle bg-surface-1 text-studio-text-secondary hover:border-studio-border-medium"
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{opt.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                      <p className="text-[10px] text-studio-text-muted mt-0.5 leading-tight">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label htmlFor="return-catatan" className="block text-xs font-semibold text-white mb-1">
                Catatan Inspeksi / Keterangan (Opsional)
              </label>
              <textarea
                id="return-catatan"
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Baterai telah diisi penuh, kartu memori telah dicadangkan..."
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg transition-colors min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-ink bg-spectrum-jade hover:bg-emerald-400 rounded-lg transition-all shadow-jade min-h-[44px] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Konfirmasi Pengembalian</span>
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
