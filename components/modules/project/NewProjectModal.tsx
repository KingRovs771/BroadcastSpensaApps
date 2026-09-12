"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { projectCreateSchema } from "@/lib/validations/project";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import { DivisiName, ProjectKanban } from "@/lib/mock/store";
import { X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const { currentUser, anggotaList, setProjectList, logAction } = useSession();

  const [namaProject, setNamaProject] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState(anggotaList[0]?.id || "");
  const [selectedTim, setSelectedTim] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [linkDrive, setLinkDrive] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleTim = (userId: string) => {
    setSelectedTim((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const payload = {
      nama_project: namaProject,
      deskripsi,
      penanggung_jawab: penanggungJawab,
      tim: selectedTim,
      deadline: deadline || undefined,
      divisi,
      link_drive: linkDrive || undefined,
    };

    const validation = projectCreateSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMsg(validation.error.errors[0]?.message || "Validasi gagal");
      return;
    }

    const pjAnggota = anggotaList.find((u) => u.id === penanggungJawab);

    const newProject: ProjectKanban = {
      id: `proj-${Date.now()}`,
      nama_project: namaProject,
      deskripsi,
      penanggung_jawab: penanggungJawab,
      pj_name: pjAnggota?.nama_lengkap || "PJ",
      tim: selectedTim,
      deadline,
      status: "perencanaan",
      progress: 0,
      link_drive: linkDrive,
      divisi,
      jumlah_views: 0,
      created_at: new Date().toISOString(),
    };

    setProjectList((prev) => [newProject, ...prev]);
    logAction(
      "CREATE_PROJECT",
      "project",
      newProject.id,
      `Ketua Broadcast menginisiasi proyek baru: ${namaProject}`
    );

    onClose();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-project-title"
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
              <h3 id="new-project-title" className="text-base font-bold text-white">
                Inisiasi Agenda Project Baru
              </h3>
              <p className="text-xs text-studio-text-secondary mt-0.5">
                Dibuat oleh Ketua Broadcast dengan penugasan divisi dan anggota tim.
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
            <label htmlFor="proj-nama" className="block text-xs font-semibold text-white mb-1">
              Nama Project *
            </label>
            <input
              id="proj-nama"
              type="text"
              required
              value={namaProject}
              onChange={(e) => setNamaProject(e.target.value)}
              placeholder="Contoh: Liputan Upacara Hari Pahlawan 2026"
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="proj-deskripsi" className="block text-xs font-semibold text-white mb-1">
              Deskripsi / Ruang Lingkup
            </label>
            <textarea
              id="proj-deskripsi"
              rows={2}
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              placeholder="Jelaskan tujuan liputan, target durasi, dan output dokumentasi..."
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="proj-pj" className="block text-xs font-semibold text-white mb-1">
                Penanggung Jawab (PJ) *
              </label>
              <select
                id="proj-pj"
                value={penanggungJawab}
                onChange={(e) => setPenanggungJawab(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              >
                {anggotaList.map((u) => (
                  <option key={u.id} value={u.id} className="bg-surface-2 text-white">
                    {u.nama_lengkap} ({u.jabatan})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="proj-divisi" className="block text-xs font-semibold text-white mb-1">
                Divisi Pelaksana *
              </label>
              <select
                id="proj-divisi"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="proj-deadline" className="block text-xs font-semibold text-white mb-1">
                Tenggat Waktu (Deadline)
              </label>
              <input
                id="proj-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="proj-drive" className="block text-xs font-semibold text-white mb-1">
                Tautan Google Drive (Wajib drive.google.com)
              </label>
              <input
                id="proj-drive"
                type="url"
                value={linkDrive}
                onChange={(e) => setLinkDrive(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Multi-select team members */}
          <div>
            <label className="block text-xs font-semibold text-white mb-1.5">
              Pilih Anggota Tim Terlibat
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-surface-1 rounded-lg border border-studio-border-subtle">
              {anggotaList.map((u) => {
                const isSelected = selectedTim.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleToggleTim(u.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                      isSelected
                        ? "bg-spectrum-cyan/20 border-spectrum-cyan text-spectrum-cyan font-bold"
                        : "bg-surface-2 border-studio-border-subtle text-studio-text-secondary hover:text-white"
                    }`}
                  >
                    {u.nama_lengkap}
                  </button>
                );
              })}
            </div>
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
              Inisiasi Project
            </button>
          </div>
        </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
