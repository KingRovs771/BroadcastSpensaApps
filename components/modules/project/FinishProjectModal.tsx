"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { ProjectKanban } from "@/lib/mock/store";
import { CheckCircle2, Sparkles, Loader2, X, ExternalLink, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FinishProjectModalProps {
  isOpen: boolean;
  project: ProjectKanban | null;
  onClose: () => void;
}

export function FinishProjectModal({
  isOpen,
  project,
  onClose,
}: FinishProjectModalProps) {
  const { refreshData, logAction, supabase } = useSession();
  const [isFinishing, setIsFinishing] = useState(false);
  const [linkFinalisasi, setLinkFinalisasi] = useState(project?.link_finalisasi || "");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (project) {
      setLinkFinalisasi(project.link_finalisasi || "");
      setErrorMsg(null);
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsFinishing(true);

    try {
      const todayDate = new Date().toISOString().split("T")[0];

      const { error } = await supabase
        .from("project")
        .update({
          status: "selesai",
          progress: 100,
          published_at: todayDate,
          link_finalisasi: linkFinalisasi.trim() || project.link_finalisasi || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) {
        console.error("Supabase finish project error:", error);
        setErrorMsg(`Gagal menyelesaikan project: ${error.message}`);
        setIsFinishing(false);
        return;
      }

      await refreshData();
      logAction(
        "FINISH_PROJECT",
        "project",
        project.id,
        `Menyelesaikan agenda project secara tuntas (100%): ${project.nama_project}`
      );

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsFinishing(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="finish-project-title"
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
          className="relative bg-surface-2 border border-spectrum-jade/40 rounded-2xl max-w-md w-full p-6 shadow-orbital z-10"
        >
          <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
            <div className="flex items-center gap-2.5 text-spectrum-jade">
              <div className="p-2 rounded-xl bg-spectrum-jade/10 border border-spectrum-jade/20">
                <Sparkles className="w-5 h-5 text-spectrum-jade" />
              </div>
              <div>
                <h3 id="finish-project-title" className="text-base font-bold text-white">
                  Selesaikan Agenda Project
                </h3>
                <span className="text-[11px] font-mono text-studio-text-secondary">
                  Finalisasi &amp; Publikasi Tuntas
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isFinishing}
              aria-label="Tutup modal selesaikan project"
              className="p-1.5 rounded-lg text-studio-text-muted hover:text-white hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFinish} className="py-4 space-y-4">
            <div className="p-3.5 bg-spectrum-jade/10 border border-spectrum-jade/20 rounded-xl text-xs leading-relaxed text-studio-text-secondary">
              <p className="font-bold text-white flex items-center gap-1.5 text-sm mb-1">
                <CheckCircle2 className="w-4 h-4 text-spectrum-jade" />
                Konfirmasi Penyelesaian Project
              </p>
              <p>
                Menandai project ini sebagai <span className="text-spectrum-jade font-semibold">Tuntas (100%)</span> dan mencatat tanggal publikasi resmi.
              </p>
            </div>

            <div className="p-3 bg-surface-1 rounded-xl border border-studio-border-subtle space-y-1.5 text-xs font-mono">
              <div className="text-studio-text-muted">Nama Project:</div>
              <div className="font-bold text-white text-sm break-words">
                {project.nama_project}
              </div>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-studio-text-secondary">
                <span className="px-2 py-0.5 rounded bg-surface-3 text-spectrum-cyan border border-studio-border-subtle">
                  {project.divisi}
                </span>
                <span>Progres saat ini: {project.progress}% → 100%</span>
              </div>
            </div>

            <div>
              <label htmlFor="finish-link-input" className="flex items-center gap-1.5 text-xs font-mono font-medium text-studio-text-secondary mb-1">
                <Link2 className="w-3.5 h-3.5 text-spectrum-jade" />
                Tautan Final / Hasil Tayang (Opsional)
              </label>
              <input
                id="finish-link-input"
                type="url"
                placeholder="https://drive.google.com/... atau https://youtube.com/..."
                value={linkFinalisasi}
                onChange={(e) => setLinkFinalisasi(e.target.value)}
                className="w-full bg-surface-1 border border-studio-border-subtle rounded-xl px-3 py-2 text-xs text-white placeholder-studio-text-muted focus:outline-none focus:border-spectrum-jade transition-colors"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-spectrum-crimson/10 border border-spectrum-crimson/20 text-spectrum-crimson text-xs">
                {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isFinishing}
                className="px-4 py-2 rounded-xl text-xs font-medium text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors min-h-[44px]"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isFinishing}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-spectrum-jade hover:bg-emerald-400 text-ink text-xs font-bold transition-all shadow-emerald disabled:opacity-50 min-h-[44px]"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Finish / Selesaikan Project</span>
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
