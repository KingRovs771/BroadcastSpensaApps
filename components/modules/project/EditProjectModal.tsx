"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { projectUpdateSchema } from "@/lib/validations/project";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import { DivisiName, ProjectKanban } from "@/lib/mock/store";
import { X, AlertCircle, Edit, Save, Loader2, Link2, Film, Mic, Image, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EditProjectModalProps {
  isOpen: boolean;
  project: ProjectKanban | null;
  onClose: () => void;
}

export function EditProjectModal({ isOpen, project, onClose }: EditProjectModalProps) {
  const { currentUser, allUsers, refreshData, logAction, supabase } = useSession();

  const [namaProject, setNamaProject] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [penanggungJawab, setPenanggungJawab] = useState("");
  const [selectedTim, setSelectedTim] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [status, setStatus] = useState<ProjectKanban["status"]>("perencanaan");
  const [progress, setProgress] = useState(0);
  const [linkVideo, setLinkVideo] = useState("");
  const [linkAudio, setLinkAudio] = useState("");
  const [linkThumbnail, setLinkThumbnail] = useState("");
  const [linkFinalisasi, setLinkFinalisasi] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setNamaProject(project.nama_project || "");
      setDeskripsi(project.deskripsi || "");
      setPenanggungJawab(project.penanggung_jawab || currentUser?.id || "");
      setSelectedTim(project.tim || []);
      setDeadline(project.deadline ? project.deadline.split("T")[0] : "");
      setDivisi(project.divisi || "Broadcasting");
      setStatus(project.status || "perencanaan");
      setProgress(project.progress || 0);
      setLinkVideo(project.link_video || "");
      setLinkAudio(project.link_audio || "");
      setLinkThumbnail(project.link_thumbnail || "");
      setLinkFinalisasi(project.link_finalisasi || "");
      setErrorMsg(null);
    }
  }, [project, currentUser]);

  if (!isOpen || !project) return null;

  const handleToggleTim = (userId: string) => {
    setSelectedTim((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const pjId = penanggungJawab || currentUser.id;

    const payload = {
      nama_project: namaProject,
      deskripsi: deskripsi || undefined,
      penanggung_jawab: pjId,
      tim: selectedTim,
      deadline: deadline || undefined,
      divisi,
      status,
      progress,
      link_video: linkVideo || undefined,
      link_audio: linkAudio || undefined,
      link_thumbnail: linkThumbnail || undefined,
      link_finalisasi: linkFinalisasi || undefined,
    };

    const validation = projectUpdateSchema.safeParse(payload);
    if (!validation.success) {
      setErrorMsg(validation.error.errors[0]?.message || "Validasi gagal");
      setIsSubmitting(false);
      return;
    }

    try {
      const publishedAt =
        status === "selesai"
          ? project.published_at || new Date().toISOString().split("T")[0]
          : null;

      const { error } = await supabase
        .from("project")
        .update({
          nama_project: namaProject,
          deskripsi: deskripsi || null,
          penanggung_jawab: pjId,
          tim: selectedTim,
          deadline: deadline || null,
          status,
          progress,
          link_video: linkVideo.trim() || null,
          link_audio: linkAudio.trim() || null,
          link_thumbnail: linkThumbnail.trim() || null,
          link_finalisasi: linkFinalisasi.trim() || null,
          divisi,
          published_at: publishedAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", project.id);

      if (error) {
        console.error("Supabase update project error:", error);
        setErrorMsg(`Gagal memperbarui project: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      await refreshData();
      logAction(
        "UPDATE_PROJECT",
        "project",
        project.id,
        `Memperbarui data project: ${namaProject}`
      );

      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(`Terjadi kesalahan sistem: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-title"
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
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-spectrum-cyan/10 text-spectrum-cyan border border-spectrum-cyan/20">
                <Edit className="w-4 h-4" />
              </div>
              <div>
                <h3 id="edit-project-title" className="text-base font-bold text-white">
                  Edit Data Project Kanban
                </h3>
                <p className="text-xs text-studio-text-secondary mt-0.5">
                  Perbarui status alur kerja, penugasan tim, tenggat waktu, dan link produksi.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup modal edit project"
              className="p-1.5 rounded-lg text-studio-text-muted hover:text-white hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            {errorMsg && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-spectrum-crimson/10 border border-spectrum-crimson/20 text-spectrum-crimson text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Nama Project */}
            <div>
              <label htmlFor="edit-nama-project" className="block text-xs font-mono font-medium text-studio-text-secondary mb-1">
                Nama Project <span className="text-spectrum-crimson">*</span>
              </label>
              <input
                id="edit-nama-project"
                type="text"
                required
                value={namaProject}
                onChange={(e) => setNamaProject(e.target.value)}
                className="w-full bg-surface-1 border border-studio-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-studio-text-muted focus:outline-none focus:border-spectrum-cyan transition-colors"
              />
            </div>

            {/* Divisi & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-divisi-project" className="block text-xs font-mono font-medium text-studio-text-secondary mb-1">
                  Divisi Pelaksana
                </label>
                <select
                  id="edit-divisi-project"
                  value={divisi}
                  onChange={(e) => setDivisi(e.target.value as DivisiName)}
                  className="w-full bg-surface-1 border border-studio-border-subtle rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-spectrum-cyan transition-colors"
                >
                  {DIVISI_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-surface-2">
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-status-project" className="block text-xs font-mono font-medium text-studio-text-secondary mb-1">
                  Kolom Status
                </label>
                <select
                  id="edit-status-project"
                  value={status}
                  onChange={(e) => {
                    const nextSt = e.target.value as ProjectKanban["status"];
                    setStatus(nextSt);
                    if (nextSt === "selesai" && progress < 100) {
                      setProgress(100);
                    }
                  }}
                  className="w-full bg-surface-1 border border-studio-border-subtle rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-spectrum-cyan transition-colors"
                >
                  <option value="perencanaan" className="bg-surface-2">Perencanaan</option>
                  <option value="proses" className="bg-surface-2">Dalam Proses</option>
                  <option value="selesai" className="bg-surface-2">Selesai</option>
                  <option value="tunda" className="bg-surface-2">Ditunda</option>
                </select>
              </div>
            </div>

            {/* Progress Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-studio-text-secondary mb-1">
                <label htmlFor="edit-progress-slider">Progres Teknis</label>
                <span className="font-bold text-white bg-surface-3 px-2 py-0.5 rounded border border-studio-border-subtle">
                  {progress}%
                </span>
              </div>
              <input
                id="edit-progress-slider"
                type="range"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-surface-1 rounded-lg appearance-none cursor-pointer accent-spectrum-cyan"
              />
            </div>

            {/* PJ & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-pj-project" className="block text-xs font-mono font-medium text-studio-text-secondary mb-1">
                  Penanggung Jawab (PJ) <span className="text-spectrum-crimson">*</span>
                </label>
                <select
                  id="edit-pj-project"
                  value={penanggungJawab}
                  onChange={(e) => setPenanggungJawab(e.target.value)}
                  className="w-full bg-surface-1 border border-studio-border-subtle rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-spectrum-cyan transition-colors"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id} className="bg-surface-2">
                      {u.nama} ({u.divisi || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-deadline-project" className="block text-xs font-mono font-medium text-studio-text-secondary mb-1">
                  Target Deadline
                </label>
                <input
                  id="edit-deadline-project"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-surface-1 border border-studio-border-subtle rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-spectrum-cyan transition-colors"
                />
              </div>
            </div>

            {/* Tim / Kolaborator */}
            <div>
              <span className="block text-xs font-mono font-medium text-studio-text-secondary mb-1.5">
                Tim Kolaborator
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-surface-1 rounded-xl border border-studio-border-subtle">
                {allUsers.map((u) => {
                  const isSelected = selectedTim.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleToggleTim(u.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-mono border transition-all ${
                        isSelected
                          ? "bg-spectrum-cobalt/20 border-spectrum-cobalt text-sky-300 font-bold"
                          : "bg-surface-2 border-studio-border-subtle text-studio-text-muted hover:border-studio-border-medium hover:text-white"
                      }`}
                    >
                      {isSelected ? "✓ " : "+ "}
                      {u.nama}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Link-link Produksi */}
            <div className="p-3.5 bg-surface-1/60 rounded-xl border border-studio-border-subtle space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-white">
                <Link2 className="w-3.5 h-3.5 text-spectrum-cyan" />
                <span>Tautan Hasil &amp; Finalisasi Produksi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="edit-link-video" className="flex items-center gap-1 text-[11px] font-mono text-studio-text-secondary mb-1">
                    <Film className="w-3 h-3 text-spectrum-cyan" />
                    Link Video (Drive/YT)
                  </label>
                  <input
                    id="edit-link-video"
                    type="url"
                    placeholder="https://..."
                    value={linkVideo}
                    onChange={(e) => setLinkVideo(e.target.value)}
                    className="w-full bg-surface-2 border border-studio-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-studio-text-muted focus:outline-none focus:border-spectrum-cyan transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-link-audio" className="flex items-center gap-1 text-[11px] font-mono text-studio-text-secondary mb-1">
                    <Mic className="w-3 h-3 text-spectrum-lime" />
                    Link Audio / Podcast
                  </label>
                  <input
                    id="edit-link-audio"
                    type="url"
                    placeholder="https://..."
                    value={linkAudio}
                    onChange={(e) => setLinkAudio(e.target.value)}
                    className="w-full bg-surface-2 border border-studio-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-studio-text-muted focus:outline-none focus:border-spectrum-lime transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-link-thumbnail" className="flex items-center gap-1 text-[11px] font-mono text-studio-text-secondary mb-1">
                    <Image className="w-3 h-3 text-orbital-magenta" />
                    Link Thumbnail Cover
                  </label>
                  <input
                    id="edit-link-thumbnail"
                    type="url"
                    placeholder="https://..."
                    value={linkThumbnail}
                    onChange={(e) => setLinkThumbnail(e.target.value)}
                    className="w-full bg-surface-2 border border-studio-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-studio-text-muted focus:outline-none focus:border-orbital-magenta transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="edit-link-finalisasi" className="flex items-center gap-1 text-[11px] font-mono text-studio-text-secondary mb-1">
                    <CheckCircle2 className="w-3 h-3 text-spectrum-tangerine" />
                    Link Finalisasi / Siap Tayang
                  </label>
                  <input
                    id="edit-link-finalisasi"
                    type="url"
                    placeholder="https://..."
                    value={linkFinalisasi}
                    onChange={(e) => setLinkFinalisasi(e.target.value)}
                    className="w-full bg-surface-2 border border-studio-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-studio-text-muted focus:outline-none focus:border-spectrum-tangerine transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="edit-deskripsi-project" className="block text-xs font-mono font-medium text-studio-text-secondary mb-1">
                Deskripsi / Catatan Singkat
              </label>
              <textarea
                id="edit-deskripsi-project"
                rows={2}
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Rangkuman konsep, sasaran penonton, atau arahan teknis..."
                className="w-full bg-surface-1 border border-studio-border-subtle rounded-xl px-3.5 py-2 text-xs text-white placeholder-studio-text-muted focus:outline-none focus:border-spectrum-cyan transition-colors resize-none"
              />
            </div>

            {/* Tombol Simpan & Batal */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-medium text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors min-h-[44px]"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan disabled:opacity-50 min-h-[44px]"
              >
                {isSubmitting ? (
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
