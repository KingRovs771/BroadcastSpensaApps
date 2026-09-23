"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { NewProjectModal } from "@/components/modules/project/NewProjectModal";
import { ProjectKanban } from "@/lib/mock/store";
import {
  Kanban,
  Plus,
  ExternalLink,
  Calendar,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
} from "lucide-react";

export default function ProjectPage() {
  const { currentUser, projectList, allUsers, refreshData, logAction, supabase } = useSession();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [filterDivisi, setFilterDivisi] = useState<string>("all");

  const isKetuaOrAdmin =
    currentUser.role === "ketua_broadcast" || currentUser.role === "administrator";

  const columns: Array<{
    id: ProjectKanban["status"];
    title: string;
    borderClass: string;
    badgeBg: string;
  }> = [
    {
      id: "perencanaan",
      title: "Perencanaan",
      borderClass: "border-t-4 border-t-spectrum-amber",
      badgeBg: "bg-spectrum-amber/20 text-spectrum-amber",
    },
    {
      id: "proses",
      title: "Dalam Proses",
      borderClass: "border-t-4 border-t-spectrum-cyan",
      badgeBg: "bg-spectrum-cyan/20 text-spectrum-cyan",
    },
    {
      id: "selesai",
      title: "Selesai",
      borderClass: "border-t-4 border-t-spectrum-jade",
      badgeBg: "bg-spectrum-jade/20 text-spectrum-jade",
    },
    {
      id: "tunda",
      title: "Ditunda",
      borderClass: "border-t-4 border-t-slate-500",
      badgeBg: "bg-slate-500/20 text-slate-400",
    },
  ];

  const handleMoveStatus = async (
    projectId: string,
    nextStatus: ProjectKanban["status"]
  ) => {
    const existing = projectList.find((p) => p.id === projectId);
    const progress =
      nextStatus === "selesai" ? 100 : nextStatus === "perencanaan" ? 10 : existing?.progress || 0;
    const published_at =
      nextStatus === "selesai" ? new Date().toISOString().split("T")[0] : null;

    try {
      const { error } = await supabase
        .from("project")
        .update({
          status: nextStatus,
          progress,
          published_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) {
        console.error("Error moving project status:", error);
        alert(`Gagal memindahkan status project: ${error.message}`);
        return;
      }

      await refreshData();
      logAction(
        "MOVE_PROJECT_STATUS",
        "project",
        projectId,
        `Memindahkan project ke status: ${nextStatus.toUpperCase()}`
      );
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    }
  };

  const handleProgressChange = async (projectId: string, newProgress: number) => {
    try {
      const { error } = await supabase
        .from("project")
        .update({
          progress: newProgress,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (error) {
        console.error("Error updating progress:", error);
        return;
      }

      await refreshData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projectList.filter((p) =>
    filterDivisi === "all" ? true : p.divisi === filterDivisi
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Kanban className="w-5 h-5 text-spectrum-cyan" />
            Agenda Project Kanban
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Visualisasi alur kerja project non-reguler, dokumentasi Google Drive, dan atribusi PJ.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isKetuaOrAdmin && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              aria-label="Inisiasi Project Baru"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Inisiasi Project Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* 4-Column High Speed Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {columns.map((col) => {
          const colProjects = filteredProjects.filter((p) => p.status === col.id);

          return (
            <div
              key={col.id}
              className={`bg-surface-1 rounded-2xl p-4 border border-studio-border-subtle ${col.borderClass} flex flex-col min-h-[400px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle mb-3">
                <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
                  {col.title}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${col.badgeBg}`}
                >
                  {colProjects.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 flex-1">
                {colProjects.length === 0 ? (
                  <div className="text-center py-8 text-xs text-studio-text-muted border border-dashed border-studio-border-subtle rounded-xl font-mono">
                    Belum ada project
                  </div>
                ) : (
                  colProjects.map((project) => (
                    <div
                      key={project.id}
                      className="bg-surface-2 border border-studio-border-subtle hover:border-studio-border-medium rounded-xl p-3.5 space-y-2.5 shadow-sm transition-all group"
                    >
                      {/* Badge & Division */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-3 text-spectrum-cyan border border-studio-border-subtle">
                          {project.divisi}
                        </span>
                        {project.deadline && (
                          <span className="text-[10px] font-mono text-studio-text-muted flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {project.deadline}
                          </span>
                        )}
                      </div>

                      {/* Project Title & Description */}
                      <div>
                        <h4 className="text-xs font-bold text-white leading-snug">
                          {project.nama_project}
                        </h4>
                        {project.deskripsi && (
                          <p className="text-[11px] text-studio-text-secondary mt-1 line-clamp-2">
                            {project.deskripsi}
                          </p>
                        )}
                      </div>

                      {/* Progress slider bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-studio-text-secondary">
                          <span>Progres Teknis</span>
                          <span className="font-bold text-white">{project.progress}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={project.progress}
                          onChange={(e) =>
                            handleProgressChange(project.id, Number(e.target.value))
                          }
                          aria-label={`Slider progres untuk ${project.nama_project}`}
                          className="w-full h-1.5 bg-surface-1 rounded-lg appearance-none cursor-pointer accent-spectrum-cyan"
                        />
                      </div>

                      {/* PJ & Links Pill */}
                      <div className="flex items-center justify-between pt-2 border-t border-studio-border-subtle text-[11px]">
                        <div className="flex items-center gap-1.5 text-studio-text-secondary">
                          <User className="w-3 h-3 text-orbital-magenta" />
                          <span className="truncate max-w-[110px]">
                            {allUsers.find((u) => u.id === project.penanggung_jawab)?.nama || project.pj_name || "PJ"}
                          </span>
                        </div>

                        {project.link_drive && (
                          <a
                            href={project.link_drive}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-mono text-spectrum-cyan hover:underline"
                          >
                            <span>Drive</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>

                      {/* Move Column Actions */}
                      <div className="flex items-center justify-between pt-1 border-t border-studio-border-subtle/50 text-[10px] font-mono">
                        {col.id !== "perencanaan" ? (
                          <button
                            onClick={() => {
                              const prev =
                                col.id === "selesai"
                                  ? "proses"
                                  : col.id === "tunda"
                                  ? "proses"
                                  : "perencanaan";
                              handleMoveStatus(project.id, prev);
                            }}
                            className="flex items-center gap-1 text-studio-text-muted hover:text-white"
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Kembali</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        {col.id !== "selesai" && (
                          <button
                            onClick={() => {
                              const next =
                                col.id === "perencanaan"
                                  ? "proses"
                                  : col.id === "proses"
                                  ? "selesai"
                                  : "proses";
                              handleMoveStatus(project.id, next);
                            }}
                            className="flex items-center gap-1 text-spectrum-cyan hover:text-white font-bold ml-auto"
                          >
                            <span>Maju</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Initiation Modal */}
      <NewProjectModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />
    </div>
  );
}

