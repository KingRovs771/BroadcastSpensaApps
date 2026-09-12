"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { DIVISI_OPTIONS, PRODUKSI_JENIS_OPTIONS, produksiUploadSchema } from "@/lib/validations/produksi";
import { ProduksiVideo, DivisiName } from "@/lib/mock/store";
import { X, Film, AlertCircle, FileText, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewProduksiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProduksiModal({ isOpen, onClose }: NewProduksiModalProps) {
  const { currentUser, setProduksiList, logAction } = useSession();

  const [judul, setJudul] = useState("");
  const [jenis, setJenis] = useState<"podcast" | "video" | "liputan" | "live">("video");
  const [divisi, setDivisi] = useState<DivisiName>("Kreatif");
  const [mode, setMode] = useState<"script" | "podcast">("script");
  const [scriptText, setScriptText] = useState("");
  const [podcastText, setPodcastText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      judul,
      jenis,
      divisi,
      script_text: mode === "script" ? scriptText : undefined,
      pertanyaan_podcast: mode === "podcast" ? podcastText : undefined,
    };

    const validation = produksiUploadSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMsg(validation.error.errors[0]?.message || "Validasi gagal");
      return;
    }

    const newProd: ProduksiVideo = {
      id: `prod-${Date.now()}`,
      judul,
      jenis,
      divisi,
      status: "pending_approval",
      uploaded_by: currentUser.id,
      uploader_name: currentUser.nama,
      script_text: mode === "script" ? scriptText : undefined,
      pertanyaan_podcast: mode === "podcast" ? podcastText : undefined,
      jumlah_views: 0,
      created_at: new Date().toISOString(),
    };

    setProduksiList((prev) => [newProd, ...prev]);
    logAction(
      "CREATE_PRODUKSI",
      "produksi_video",
      newProd.id,
      `Membuat naskah baru: ${judul} (${divisi})`
    );

    // Reset and close
    setJudul("");
    setScriptText("");
    setPodcastText("");
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
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
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-xl w-full p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10"
        >
          <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
            <div>
              <h3 id="modal-title" className="text-base font-bold text-white">
                Ajukan Naskah Produksi Baru
              </h3>
              <p className="text-xs text-studio-text-secondary mt-0.5">
                Naskah akan melalui kurasi Dual-Gate (Pembina & Ketua Umum).
              </p>
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
            <label htmlFor="prod-judul" className="block text-xs font-semibold text-white mb-1">
              Judul Produksi / Liputan *
            </label>
            <input
              id="prod-judul"
              type="text"
              required
              value={judul}
              onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Liputan Peringatan Hari Pahlawan 2026"
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prod-jenis" className="block text-xs font-semibold text-white mb-1">
                Format Produksi *
              </label>
              <select
                id="prod-jenis"
                value={jenis}
                onChange={(e) => setJenis(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              >
                {PRODUKSI_JENIS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-surface-2 text-white">
                    {opt.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prod-divisi" className="block text-xs font-semibold text-white mb-1">
                Divisi Pelaksana *
              </label>
              <select
                id="prod-divisi"
                value={divisi}
                onChange={(e) => setDivisi(e.target.value as DivisiName)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              >
                {DIVISI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="bg-surface-2 text-white">
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab selector for script vs podcast */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setMode("script")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all min-h-[40px] ${
                  mode === "script"
                    ? "bg-spectrum-cyan/20 border-spectrum-cyan text-spectrum-cyan"
                    : "bg-surface-1 border-studio-border-subtle text-studio-text-secondary"
                }`}
              >
                Naskah Script (Min 50 Karakter)
              </button>
              <button
                type="button"
                onClick={() => setMode("podcast")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all min-h-[40px] ${
                  mode === "podcast"
                    ? "bg-orbital-violet/20 border-orbital-violet text-orbital-magenta"
                    : "bg-surface-1 border-studio-border-subtle text-studio-text-secondary"
                }`}
              >
                Pertanyaan Podcast (Min 3 Butir)
              </button>
            </div>

            {mode === "script" ? (
              <div>
                <label htmlFor="prod-script" className="sr-only">Naskah Script</label>
                <textarea
                  id="prod-script"
                  rows={5}
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Ketikkan pembukaan narasi, dialog reporter, atau instruksi adegan minimal 50 karakter..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white font-mono placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none"
                />
                <span className="text-[10px] font-mono text-studio-text-muted">
                  Panjang saat ini: {scriptText.length} karakter
                </span>
              </div>
            ) : (
              <div>
                <label htmlFor="prod-podcast" className="sr-only">Daftar Pertanyaan Podcast</label>
                <textarea
                  id="prod-podcast"
                  rows={5}
                  value={podcastText}
                  onChange={(e) => setPodcastText(e.target.value)}
                  placeholder="1. Apa latar belakang ide ini?&#10;2. Bagaimana proses persiapannya?&#10;3. Apa harapan untuk ke depannya?"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white font-mono placeholder:text-studio-text-muted focus:border-orbital-violet focus:outline-none"
                />
                <span className="text-[10px] font-mono text-studio-text-muted">
                  Jumlah pertanyaan terdeteksi:{" "}
                  {podcastText.split("\n").filter((l) => l.trim().length > 0).length} butir
                </span>
              </div>
            )}
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
              className="px-5 py-2 text-xs font-bold text-white bg-spectrum-cobalt hover:bg-blue-600 rounded-lg transition-all shadow-cyan min-h-[44px]"
            >
              Kirim ke Dual-Gate
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
