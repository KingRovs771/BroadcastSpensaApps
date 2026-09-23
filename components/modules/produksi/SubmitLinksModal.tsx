"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { ProduksiVideo } from "@/lib/mock/store";
import { X, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SubmitLinksModalProps {
  item: ProduksiVideo;
  isOpen: boolean;
  onClose: () => void;
}

export function SubmitLinksModal({ item, isOpen, onClose }: SubmitLinksModalProps) {
  const { refreshData, logAction, supabase } = useSession();

  const [thumbnailUrl, setThumbnailUrl] = useState(item.thumbnail_url || "");
  const [videoUrl, setVideoUrl] = useState(item.video_url || "");
  const [audioUrl, setAudioUrl] = useState(item.audio_url || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("produksi_video")
        .update({
          thumbnail_url: thumbnailUrl || null,
          video_url: videoUrl || null,
          audio_url: audioUrl || null,
          status: "pending_divisi",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        console.error("Error submitting links:", error);
        alert(`Gagal mengirimkan link: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      await refreshData();
      logAction(
        "SUBMIT_PRODUKSI_LINKS",
        "produksi_video",
        item.id,
        `PJ mengunggah link media untuk ${item.judul}`
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-link-title"
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
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-lg w-full p-6 shadow-orbital z-10"
        >
          <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
            <div>
              <h3 id="submit-link-title" className="text-base font-bold text-white">
                Kirim Link Hasil Produksi
              </h3>
              <p className="text-xs text-studio-text-secondary mt-0.5">
                Target: {item.judul}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="url-thumb" className="block text-xs font-semibold text-white mb-1">
              URL Thumbnail / Poster
            </label>
            <input
              id="url-thumb"
              type="url"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://drive.google.com/... atau https://..."
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="url-video" className="block text-xs font-semibold text-white mb-1">
              URL Master Video / YouTube
            </label>
            <input
              id="url-video"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="url-audio" className="block text-xs font-semibold text-white mb-1">
              URL Master Audio / Podcast (Opsional)
            </label>
            <input
              id="url-audio"
              type="url"
              value={audioUrl}
              onChange={(e) => setAudioUrl(e.target.value)}
              placeholder="https://spotify.com/... atau https://drive.google.com/..."
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
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
              className="px-5 py-2 text-xs font-bold text-white bg-spectrum-jade hover:bg-emerald-600 rounded-lg transition-all shadow-jade min-h-[44px]"
            >
              Kirim ke Ketua Divisi
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
