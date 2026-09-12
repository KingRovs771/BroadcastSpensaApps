"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { DualGateBanner } from "@/components/modules/produksi/DualGateBanner";
import { NewProduksiModal } from "@/components/modules/produksi/NewProduksiModal";
import { SubmitLinksModal } from "@/components/modules/produksi/SubmitLinksModal";
import { StatusBadge, BadgeVariant } from "@/components/ui/StatusBadge";
import { ProduksiVideo } from "@/lib/mock/store";
import {
  Plus,
  Video,
  Eye,
  CheckCircle,
  ExternalLink,
  UserPlus,
  Layers,
  Sparkles,
} from "lucide-react";

export default function ProduksiPage() {
  const { currentUser, produksiList, setProduksiList, anggotaList, logAction } =
    useSession();

  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "in_production" | "done">("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedForLinks, setSelectedForLinks] = useState<ProduksiVideo | null>(null);

  const isKreatifOrAdmin =
    currentUser.role === "div_kreatif" ||
    currentUser.role === "ketua_divisi" ||
    currentUser.role === "administrator";

  const isKetuaBroadcast =
    currentUser.role === "ketua_broadcast" || currentUser.role === "administrator";

  const filteredList = produksiList.filter((p) => {
    if (activeFilter === "pending") {
      return (
        p.status === "pending_approval" ||
        p.status === "pending_pembina" ||
        p.status === "pending_ketua"
      );
    }
    if (activeFilter === "in_production") {
      return p.status === "in_production" || p.status === "pending_divisi";
    }
    if (activeFilter === "done") {
      return p.status === "done" || p.status === "published";
    }
    return true;
  });

  // Action: Assign PJ (only when status is approved)
  const handleAssignPJ = (prodId: string, pjUserId: string) => {
    const pjAnggota = anggotaList.find((u) => u.id === pjUserId);
    const pjName = pjAnggota?.nama_lengkap ?? pjUserId;
    setProduksiList((prev) =>
      prev.map((p) => {
        if (p.id === prodId) {
          return {
            ...p,
            status: "in_production",
            penanggung_jawab_id: pjUserId,
            pj_name: pjName,
          };
        }
        return p;
      })
    );
    logAction(
      "ASSIGN_PJ",
      "produksi_video",
      prodId,
      `Menugaskan PJ: ${pjName}`
    );
  };

  // Action: Final Curate by Ketua Divisi
  const handleFinalCurate = (prod: ProduksiVideo) => {
    const isMatchingKetuaDivisi =
      (currentUser.role === "ketua_divisi" && currentUser.divisi === prod.divisi) ||
      currentUser.role === "administrator";

    if (!isMatchingKetuaDivisi) {
      alert(`Hanya Ketua Divisi ${prod.divisi} yang berwenang melakukan kurasi final naskah ini!`);
      return;
    }

    setProduksiList((prev) =>
      prev.map((p) => {
        if (p.id === prod.id) {
          return {
            ...p,
            status: "published",
            published_at: new Date().toISOString().split("T")[0],
          };
        }
        return p;
      })
    );
    logAction(
      "FINAL_CURATE_PRODUKSI",
      "produksi_video",
      prod.id,
      `Ketua Divisi ${currentUser.divisi} menyetujui publikasi final`
    );
  };

  // Action: Update Views
  const handleUpdateViews = (prodId: string) => {
    const input = prompt("Masukkan jumlah views terkini (YouTube / Medsos):");
    if (!input) return;
    const views = parseInt(input, 10);
    if (isNaN(views) || views < 0) return;

    setProduksiList((prev) =>
      prev.map((p) => {
        if (p.id === prodId) {
          return {
            ...p,
            jumlah_views: views,
          };
        }
        return p;
      })
    );
    logAction(
      "UPDATE_VIEWS",
      "produksi_video",
      prodId,
      `Memperbarui views menjadi ${views.toLocaleString()}`
    );
  };

  const getStatusBadge = (status: ProduksiVideo["status"]): { label: string; variant: BadgeVariant } => {
    switch (status) {
      case "pending_approval":
        return { label: "Dual Gate (0/2)", variant: "amber" };
      case "pending_pembina":
        return { label: "Menunggu Pembina", variant: "amber" };
      case "pending_ketua":
        return { label: "Menunggu Ketua", variant: "amber" };
      case "approved":
        return { label: "Dual Approved", variant: "jade" };
      case "in_production":
        return { label: "In Production", variant: "mandarin" };
      case "pending_divisi":
        return { label: "Kurasi Divisi", variant: "cyan" };
      case "done":
      case "published":
        return { label: "Published", variant: "jade" };
      case "rejected":
        return { label: "Rejected", variant: "tangerine" };
      default:
        return { label: status, variant: "muted" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-spectrum-cyan" />
              Pipeline Produksi Video & Podcast
            </h1>
          </div>
          <p className="text-xs text-studio-text-secondary mt-1">
            Kurasi bertingkat Dual-Gate (Pembina & Ketua Umum), pelacakan progres shooting, dan analitik views.
          </p>
        </div>

        {isKreatifOrAdmin && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            aria-label="Upload Naskah Produksi Baru"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Ajukan Naskah Baru</span>
          </button>
        )}
      </div>

      {/* Metric Counters Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-studio-text-secondary uppercase">
            Total Pipeline
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {produksiList.length}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-amber uppercase">
            Menunggu Dual-Gate
          </p>
          <p className="text-2xl font-bold font-mono text-spectrum-amber mt-1">
            {
              produksiList.filter(
                (p) =>
                  p.status === "pending_approval" ||
                  p.status === "pending_pembina" ||
                  p.status === "pending_ketua"
              ).length
            }
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-mandarin uppercase">
            Sedang Diproduksi
          </p>
          <p className="text-2xl font-bold font-mono text-spectrum-mandarin mt-1">
            {
              produksiList.filter(
                (p) => p.status === "in_production" || p.status === "pending_divisi"
              ).length
            }
          </p>
        </div>
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-jade uppercase">
            Tayang / Published
          </p>
          <p className="text-2xl font-bold font-mono text-spectrum-jade mt-1">
            {produksiList.filter((p) => p.status === "published").length}
          </p>
        </div>
      </div>

      {/* Dual-Gate Attention Section (Prominent Banners) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-spectrum-amber" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            Dual-Gate Active Banners (Perlu Tindakan)
          </h2>
        </div>

        {produksiList
          .filter(
            (p) =>
              p.status === "pending_approval" ||
              p.status === "pending_pembina" ||
              p.status === "pending_ketua" ||
              p.status === "approved"
          )
          .map((item) => (
            <DualGateBanner key={item.id} item={item} onUpdate={() => {}} />
          ))}
      </div>

      {/* Filter Tabs & Production Items Grid */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-4 lg:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-studio-border-subtle">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                activeFilter === "all"
                  ? "bg-spectrum-cyan text-cosmic font-extrabold"
                  : "bg-surface-2 text-studio-text-secondary hover:text-white"
              }`}
            >
              Semua ({produksiList.length})
            </button>
            <button
              onClick={() => setActiveFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                activeFilter === "pending"
                  ? "bg-spectrum-amber text-cosmic font-extrabold"
                  : "bg-surface-2 text-studio-text-secondary hover:text-white"
              }`}
            >
              Dual-Gate Pending
            </button>
            <button
              onClick={() => setActiveFilter("in_production")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                activeFilter === "in_production"
                  ? "bg-spectrum-mandarin text-cosmic font-extrabold"
                  : "bg-surface-2 text-studio-text-secondary hover:text-white"
              }`}
            >
              Dalam Produksi
            </button>
            <button
              onClick={() => setActiveFilter("done")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors min-h-[36px] ${
                activeFilter === "done"
                  ? "bg-spectrum-jade text-cosmic font-extrabold"
                  : "bg-surface-2 text-studio-text-secondary hover:text-white"
              }`}
            >
              Published
            </button>
          </div>
        </div>

        {/* List of cards */}
        <div className="space-y-3">
          {filteredList.map((prod) => {
            const badge = getStatusBadge(prod.status);
            const isPJ = currentUser.id === prod.penanggung_jawab_id || currentUser.role === "administrator";
            const isMatchingKetuaDivisi =
              (currentUser.role === "ketua_divisi" && currentUser.divisi === prod.divisi) ||
              currentUser.role === "administrator";

            return (
              <div
                key={prod.id}
                className="p-4 rounded-xl bg-surface-2 border border-studio-border-subtle hover:border-studio-border-medium transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge label={badge.label} variant={badge.variant} />
                    <span className="text-[10px] font-mono text-studio-text-muted">
                      Divisi {prod.divisi} · Diupload {prod.uploader_name}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{prod.judul}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-studio-text-secondary">
                    <span>
                      PJ:{" "}
                      <strong className="text-white">
                        {prod.pj_name || "Belum ditugaskan"}
                      </strong>
                    </span>
                    {prod.jumlah_views > 0 && (
                      <span className="flex items-center gap-1 font-mono text-spectrum-cyan">
                        <Eye className="w-3.5 h-3.5" />
                        {prod.jumlah_views.toLocaleString()} views
                      </span>
                    )}
                    {prod.published_at && (
                      <span className="font-mono text-[11px] text-spectrum-jade">
                        Tayang: {prod.published_at}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Action Tray based on role and state */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Assign PJ: Available when approved and user is Ketua Broadcast or Admin */}
                  {prod.status === "approved" && isKetuaBroadcast && (
                    <div className="flex items-center gap-1.5 bg-surface-3 p-1.5 rounded-lg border border-studio-border-subtle">
                      <UserPlus className="w-3.5 h-3.5 text-spectrum-jade ml-1" />
                      <select
                        aria-label="Tugaskan Penanggung Jawab"
                        onChange={(e) => {
                          if (e.target.value) handleAssignPJ(prod.id, e.target.value);
                        }}
                        defaultValue=""
                        className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          Pilih PJ Proyek...
                        </option>
                        {anggotaList
                          .filter((u) => u.status === "aktif")
                          .map((u) => (
                            <option key={u.id} value={u.id} className="bg-surface-2 text-white">
                              {u.nama_lengkap} ({u.divisi || "Umum"})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* PJ Input Deliverable Links */}
                  {prod.status === "in_production" && isPJ && (
                    <button
                      onClick={() => setSelectedForLinks(prod)}
                      className="px-3 py-1.5 rounded-lg bg-spectrum-mandarin/20 hover:bg-spectrum-mandarin/30 text-spectrum-mandarin text-xs font-bold border border-spectrum-mandarin/40 transition-colors min-h-[36px]"
                    >
                      Kirim Link Hasil
                    </button>
                  )}

                  {/* Ketua Divisi Final Approve Curation */}
                  {prod.status === "pending_divisi" && isMatchingKetuaDivisi && (
                    <button
                      onClick={() => handleFinalCurate(prod)}
                      className="px-3 py-1.5 rounded-lg bg-spectrum-jade hover:bg-emerald-500 text-ink text-xs font-bold transition-colors shadow-jade min-h-[36px]"
                    >
                      Setujui Tayang (Ketua Divisi)
                    </button>
                  )}

                  {/* Views Update Button */}
                  {(prod.status === "done" || prod.status === "published") && (
                    <button
                      onClick={() => handleUpdateViews(prod.id)}
                      className="px-3 py-1.5 rounded-lg bg-surface-3 hover:bg-surface-2 text-studio-text-secondary hover:text-white text-xs font-semibold border border-studio-border-subtle transition-colors min-h-[36px]"
                    >
                      Update Views
                    </button>
                  )}

                  {/* External preview link */}
                  {prod.video_url && (
                    <a
                      href={prod.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Tonton video di YouTube"
                      className="p-2 rounded-lg bg-surface-3 text-spectrum-cyan hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modals */}
      <NewProduksiModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      {selectedForLinks && (
        <SubmitLinksModal
          item={selectedForLinks}
          isOpen={true}
          onClose={() => setSelectedForLinks(null)}
        />
      )}
    </div>
  );
}
