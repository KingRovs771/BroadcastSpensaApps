"use client";

import React from "react";
import { ProduksiVideo } from "@/lib/mock/store";
import { useSession } from "@/components/shared/SessionContext";
import { transitionDualGateApproval } from "@/lib/utils/produksi-state";
import { CheckCircle2, Clock, XCircle, AlertCircle, Sparkles } from "lucide-react";

interface DualGateBannerProps {
  item: ProduksiVideo;
  onUpdate: () => void;
}

export function DualGateBanner({ item, onUpdate }: DualGateBannerProps) {
  const { currentUser, setProduksiList, logAction } = useSession();

  const isPembina = currentUser.role === "pembina" || currentUser.role === "administrator";
  const isKetua = currentUser.role === "ketua_broadcast" || currentUser.role === "administrator";

  const pembinaApproved = !!item.approved_pembina_by;
  const ketuaApproved = !!item.approved_ketua_by;

  const handleApprove = (actor: "pembina" | "ketua_broadcast") => {
    setProduksiList((prev) =>
      prev.map((p) => {
        if (p.id === item.id) {
          const next = transitionDualGateApproval(
            p,
            actor,
            "approve",
            `Disetujui oleh ${currentUser.nama}`
          );
          return next;
        }
        return p;
      })
    );
    logAction(
      `APPROVE_SCRIPT_${actor.toUpperCase()}`,
      "produksi_video",
      item.id,
      `Menyetujui naskah: ${item.judul}`
    );
    onUpdate();
  };

  const handleReject = (actor: "pembina" | "ketua_broadcast") => {
    const reason = prompt("Masukkan alasan penolakan naskah:");
    if (!reason) return;

    setProduksiList((prev) =>
      prev.map((p) => {
        if (p.id === item.id) {
          return transitionDualGateApproval(p, actor, "reject", reason);
        }
        return p;
      })
    );
    logAction(
      `REJECT_SCRIPT_${actor.toUpperCase()}`,
      "produksi_video",
      item.id,
      `Menolak naskah: ${item.judul} dengan alasan: ${reason}`
    );
    onUpdate();
  };

  // State calculations
  let statusText = "Menunggu Persetujuan Dual-Gate (0/2)";
  let progressPercent = 0;

  if (pembinaApproved && ketuaApproved) {
    statusText = "Dual Approval 100% Selesai — Siap Penugasan PJ";
    progressPercent = 100;
  } else if (pembinaApproved) {
    statusText = "Disetujui Pembina (50%) — Menunggu Keputusan Ketua Broadcast";
    progressPercent = 50;
  } else if (ketuaApproved) {
    statusText = "Disetujui Ketua (50%) — Menunggu Keputusan Pembina";
    progressPercent = 50;
  }

  if (item.status === "rejected") {
    statusText = "Naskah Ditolak — Perlu Revisi Tim Kreatif";
  }

  return (
    <div className="bg-surface-2 border border-studio-border-medium rounded-xl p-4 md:p-5 shadow-lg relative overflow-hidden">
      {/* Background Accent glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orbital-violet/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-studio-border-subtle">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <h3 className="text-sm font-bold text-white leading-tight">
            {item.judul}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/30">
            DIVISI: {item.divisi.toUpperCase()}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-3 text-studio-text-secondary border border-studio-border-subtle">
            {item.jenis.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Script preview snippet */}
      {(item.script_text || item.pertanyaan_podcast) && (
        <div className="my-3 p-3 bg-surface-1 rounded-lg border border-studio-border-subtle text-xs text-studio-text-secondary line-clamp-3">
          <span className="font-semibold text-white block mb-1">
            {item.script_text ? "Naskah Script:" : "Pertanyaan Podcast:"}
          </span>
          <p className="whitespace-pre-line font-mono text-[11px]">
            {item.script_text || item.pertanyaan_podcast}
          </p>
        </div>
      )}

      {/* Dual Gate Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {/* GATE 1: PEMBINA */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            pembinaApproved
              ? "bg-spectrum-jade/10 border-spectrum-jade glow-jade text-white"
              : item.status === "rejected" && item.catatan_pembina
              ? "bg-spectrum-tangerine/10 border-spectrum-tangerine text-white"
              : "bg-surface-3/60 border-studio-border-subtle text-studio-text-secondary"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-studio-text-secondary">
              GATE 1: PEMBINA EKSTRAKURIKULER
            </span>
            {pembinaApproved ? (
              <CheckCircle2 className="w-4 h-4 text-spectrum-jade" />
            ) : item.status === "rejected" && item.catatan_pembina ? (
              <XCircle className="w-4 h-4 text-spectrum-tangerine" />
            ) : (
              <Clock className="w-4 h-4 text-spectrum-gold animate-pulse" />
            )}
          </div>

          {pembinaApproved ? (
            <div className="text-xs">
              <p className="font-semibold text-spectrum-jade flex items-center gap-1.5">
                <span>✓ Disetujui: Bpk. Haryanto, S.Pd</span>
              </p>
              {item.catatan_pembina && (
                <p className="text-[11px] text-studio-text-secondary mt-1 italic">
                  "{item.catatan_pembina}"
                </p>
              )}
            </div>
          ) : item.status === "rejected" && item.catatan_pembina ? (
            <div className="text-xs text-spectrum-tangerine">
              <p className="font-bold">Ditolak oleh Pembina</p>
              <p className="text-[11px] mt-1">{item.catatan_pembina}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-spectrum-gold font-medium">
                ⏳ Menunggu Persetujuan Pembina
              </p>
              {isPembina && item.status !== "rejected" && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleApprove("pembina")}
                    aria-label="Setujui Naskah sebagai Pembina"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-spectrum-jade hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-jade min-h-[36px]"
                  >
                    Setujui Gate 1
                  </button>
                  <button
                    onClick={() => handleReject("pembina")}
                    aria-label="Tolak Naskah sebagai Pembina"
                    className="py-1.5 px-3 rounded-lg bg-spectrum-tangerine/20 hover:bg-spectrum-tangerine/30 text-spectrum-tangerine font-bold text-xs border border-spectrum-tangerine/30 transition-colors min-h-[36px]"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* GATE 2: KETUA BROADCAST */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            ketuaApproved
              ? "bg-spectrum-jade/10 border-spectrum-jade glow-jade text-white"
              : !ketuaApproved && pembinaApproved && item.status !== "rejected"
              ? "bg-spectrum-amber/10 border-spectrum-amber animate-pulse-amber text-white"
              : "bg-surface-3/60 border-studio-border-subtle text-studio-text-secondary"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-studio-text-secondary">
              GATE 2: KETUA UMUM BROADCAST
            </span>
            {ketuaApproved ? (
              <CheckCircle2 className="w-4 h-4 text-spectrum-jade" />
            ) : item.status === "rejected" && item.catatan_ketua ? (
              <XCircle className="w-4 h-4 text-spectrum-tangerine" />
            ) : (
              <Clock className="w-4 h-4 text-spectrum-amber animate-pulse" />
            )}
          </div>

          {ketuaApproved ? (
            <div className="text-xs">
              <p className="font-semibold text-spectrum-jade flex items-center gap-1.5">
                <span>✓ Disetujui: Raditya Pratama</span>
              </p>
              {item.catatan_ketua && (
                <p className="text-[11px] text-studio-text-secondary mt-1 italic">
                  "{item.catatan_ketua}"
                </p>
              )}
            </div>
          ) : item.status === "rejected" && item.catatan_ketua ? (
            <div className="text-xs text-spectrum-tangerine">
              <p className="font-bold">Ditolak oleh Ketua Broadcast</p>
              <p className="text-[11px] mt-1">{item.catatan_ketua}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-spectrum-amber font-medium">
                ⏳ Menunggu Keputusan Ketua Broadcast
              </p>
              {isKetua && item.status !== "rejected" && (
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => handleApprove("ketua_broadcast")}
                    aria-label="Setujui Naskah sebagai Ketua Broadcast"
                    className="flex-1 py-1.5 px-3 rounded-lg bg-spectrum-amber hover:bg-amber-500 text-surface-1 font-bold text-xs transition-colors shadow-amber min-h-[36px]"
                  >
                    Setujui Gate 2
                  </button>
                  <button
                    onClick={() => handleReject("ketua_broadcast")}
                    aria-label="Tolak Naskah sebagai Ketua Broadcast"
                    className="py-1.5 px-3 rounded-lg bg-spectrum-tangerine/20 hover:bg-spectrum-tangerine/30 text-spectrum-tangerine font-bold text-xs border border-spectrum-tangerine/30 transition-colors min-h-[36px]"
                  >
                    Tolak
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Progress and status summary */}
      <div className="mt-4 pt-3 border-t border-studio-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-orbital-magenta" />
          <span className="font-semibold text-white">{statusText}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 bg-surface-1 rounded-full h-2 overflow-hidden border border-studio-border-subtle">
            <div
              className="bg-gradient-to-r from-spectrum-cyan to-spectrum-jade h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-studio-text-secondary">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
