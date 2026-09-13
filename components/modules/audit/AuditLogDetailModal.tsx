"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuditLogItem } from "@/lib/mock/store";
import {
  X,
  ShieldCheck,
  Clock,
  User,
  Database,
  FileCode,
  Copy,
  Check,
  Info,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface AuditLogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogItem | null;
}

export function AuditLogDetailModal({
  isOpen,
  onClose,
  log,
}: AuditLogDetailModalProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isOpen || !log) return null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getActionBadgeColor = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("DELETE") || act.includes("RESET") || act.includes("HAPUS")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    if (act.includes("CREATE") || act.includes("TAMBAH") || act.includes("REGISTER") || act.includes("BAYAR")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("MUTASI")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    if (act.includes("APPROVE") || act.includes("REVIEW") || act.includes("VERIF")) {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  const formattedDate = new Date(log.timestamp).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const formattedTime = new Date(log.timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audit-detail-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-studio-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-spectrum-cyan/10 border border-spectrum-cyan/20 flex items-center justify-center text-spectrum-cyan shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    id="audit-detail-title"
                    className="text-base font-bold text-white tracking-wide"
                  >
                    Inspeksi Jejak Audit
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </div>
                <p className="text-[11px] text-studio-text-secondary font-mono mt-0.5">
                  ID Transaksi: {log.id}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Tutup detail audit"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Timestamp & Verification Bar */}
          <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-studio-text-secondary">
              <Clock className="w-4 h-4 text-studio-text-muted shrink-0" />
              <span>
                <strong className="text-white">{formattedDate}</strong> pukul{" "}
                <span className="font-mono text-spectrum-cyan">{formattedTime} WIB</span>
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 self-start sm:self-auto">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Append-Only Verified</span>
            </div>
          </div>

          {/* Details Overview */}
          <div className="space-y-3 text-xs">
            <h4 className="text-[11px] font-mono text-studio-text-muted uppercase tracking-wider font-semibold">
              Informasi Pelaku & Operasi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Actor Card */}
              <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-studio-text-muted flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-spectrum-cyan" />
                    Aktor Pengguna
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-surface-3 text-white uppercase font-bold border border-studio-border-subtle">
                    {log.actor_role}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{log.actor_name}</p>
                {log.divisi && (
                  <p className="text-[11px] text-studio-text-secondary font-mono">
                    Divisi: {log.divisi}
                  </p>
                )}
                <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-studio-text-muted border-t border-studio-border-subtle/50">
                  <span className="truncate max-w-[170px]" title={log.actor_id}>
                    UID: {log.actor_id}
                  </span>
                  <button
                    onClick={() => handleCopy(log.actor_id, "actor_id")}
                    className="hover:text-white flex items-center gap-1 transition"
                    title="Salin Actor ID"
                  >
                    {copiedField === "actor_id" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* Target Entity Card */}
              <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-studio-text-muted flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    Tabel / Target
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                    public.{log.target_table}
                  </span>
                </div>
                <p className="text-xs text-studio-text-secondary">
                  Target Record ID:
                </p>
                <div className="flex items-center justify-between text-xs font-mono text-white bg-surface-2 px-2 py-1 rounded border border-studio-border-subtle">
                  <span className="truncate max-w-[170px]" title={log.target_id || "N/A"}>
                    {log.target_id || "None / Batch Record"}
                  </span>
                  {log.target_id && (
                    <button
                      onClick={() => handleCopy(log.target_id!, "target_id")}
                      className="hover:text-spectrum-cyan flex items-center gap-1 transition"
                      title="Salin Target ID"
                    >
                      {copiedField === "target_id" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
              <span className="text-[11px] text-studio-text-muted flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-studio-text-secondary" />
                Deskripsi Mutasi Data
              </span>
              <p className="text-xs text-white leading-relaxed font-medium">
                {log.details || "Tidak ada ringkasan deskripsi tambahan untuk transaksi ini."}
              </p>
            </div>
          </div>

          {/* Extra Metadata JSON */}
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-mono text-studio-text-muted uppercase tracking-wider font-semibold flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-spectrum-cyan" />
                Metadata Payload JSON (extra_json)
              </h4>
              <button
                onClick={() =>
                  handleCopy(
                    JSON.stringify(log.extra_json || {}, null, 2),
                    "json_payload"
                  )
                }
                className="text-[11px] font-mono text-studio-text-secondary hover:text-white flex items-center gap-1 px-2 py-1 rounded bg-surface-1 border border-studio-border-subtle transition"
              >
                {copiedField === "json_payload" ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin JSON</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-surface-1 border border-studio-border-subtle rounded-xl p-3 font-mono text-[11px] text-studio-text-secondary max-h-48 overflow-y-auto">
              <pre className="text-spectrum-cyan whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(
                  log.extra_json && Object.keys(log.extra_json).length > 0
                    ? log.extra_json
                    : {
                        actor_id: log.actor_id,
                        actor_name: log.actor_name,
                        actor_role: log.actor_role,
                        action: log.action,
                        target_table: log.target_table,
                        target_id: log.target_id,
                        details: log.details,
                        timestamp: log.timestamp,
                      },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3 border-t border-studio-border-subtle flex items-center justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-surface-3 hover:bg-surface-1 border border-studio-border-medium text-white text-xs font-semibold transition min-h-[44px]"
            >
              Tutup Jendela
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
