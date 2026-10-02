"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { ProjectKanban } from "@/lib/mock/store";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteProjectModalProps {
  isOpen: boolean;
  project: ProjectKanban | null;
  onClose: () => void;
}

export function DeleteProjectModal({
  isOpen,
  project,
  onClose,
}: DeleteProjectModalProps) {
  const { refreshData, logAction, supabase } = useSession();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  const handleDelete = async () => {
    setErrorMsg(null);
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("project")
        .delete()
        .eq("id", project.id);

      if (error) {
        console.error("Supabase delete project error:", error);
        setErrorMsg(`Gagal menghapus project: ${error.message}`);
        setIsDeleting(false);
        return;
      }

      await refreshData();
      logAction(
        "DELETE_PROJECT",
        "project",
        project.id,
        `Menghapus project kanban: ${project.nama_project}`
      );

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Terjadi kesalahan sistem: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-project-title"
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
          className="relative bg-surface-2 border border-spectrum-crimson/30 rounded-2xl max-w-md w-full p-6 shadow-orbital z-10"
        >
          <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
            <div className="flex items-center gap-2.5 text-spectrum-crimson">
              <div className="p-2 rounded-xl bg-spectrum-crimson/10 border border-spectrum-crimson/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 id="delete-project-title" className="text-base font-bold text-white">
                  Hapus Project Kanban
                </h3>
                <span className="text-[11px] font-mono text-studio-text-muted">
                  ID: {project.id.slice(0, 8)}...
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              aria-label="Tutup modal hapus project"
              className="p-1.5 rounded-lg text-studio-text-muted hover:text-white hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-4 space-y-3">
            <div className="flex items-start gap-3 p-3.5 bg-spectrum-crimson/10 border border-spectrum-crimson/20 rounded-xl text-xs text-spectrum-crimson leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Konfirmasi Penghapusan</p>
                <p className="text-studio-text-secondary mt-1">
                  Apakah Anda yakin ingin menghapus agenda project ini secara permanen? Data yang telah dihapus tidak dapat dipulihkan.
                </p>
              </div>
            </div>

            <div className="p-3 bg-surface-1 rounded-xl border border-studio-border-subtle space-y-1.5 text-xs font-mono">
              <div className="text-studio-text-muted">Judul Project:</div>
              <div className="font-bold text-white text-sm break-words">
                {project.nama_project}
              </div>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-studio-text-secondary">
                <span className="px-2 py-0.5 rounded bg-surface-3 text-spectrum-cyan border border-studio-border-subtle">
                  {project.divisi}
                </span>
                <span>Status: {project.status.toUpperCase()}</span>
                <span>• {project.progress}%</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-spectrum-crimson/10 border border-spectrum-crimson/20 text-spectrum-crimson text-xs">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors min-h-[44px]"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-spectrum-crimson hover:bg-red-500 text-white text-xs font-bold transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Project</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
