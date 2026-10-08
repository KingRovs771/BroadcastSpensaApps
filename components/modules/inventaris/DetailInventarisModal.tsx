"use client";

import React, { useState } from "react";
import {
  InventarisItem,
  InventarisPeminjaman,
  AnggotaRecord,
  UserProfile,
} from "@/lib/mock/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Archive,
  X,
  Tag,
  MapPin,
  Layers,
  User,
  Calendar,
  Clock,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  ShieldCheck,
  Package,
} from "lucide-react";

interface DetailInventarisModalProps {
  isOpen: boolean;
  item: InventarisItem | null;
  peminjamanList: InventarisPeminjaman[];
  anggotaList: AnggotaRecord[];
  allUsers: UserProfile[];
  onClose: () => void;
  onStartLoan: (item: InventarisItem) => void;
  onReturnLoan: (item: InventarisItem) => void;
  canManage: boolean;
}

export function DetailInventarisModal({
  isOpen,
  item,
  peminjamanList,
  anggotaList,
  allUsers,
  onClose,
  onStartLoan,
  onReturnLoan,
  canManage,
}: DetailInventarisModalProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "riwayat">("detail");

  if (!isOpen || !item) return null;

  const isBorrowed = item.status === "dipinjam";

  // Filter borrowing history specifically for this item
  const itemLoans = peminjamanList.filter(
    (loan) =>
      loan.inventaris_id === item.id ||
      (loan.kode_inventaris && loan.kode_inventaris === item.kode_inventaris)
  );

  // Penanggung jawab profile
  const pjUser = allUsers.find((u) => u.id === item.penanggung_jawab);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const getKondisiBadgeColor = (kondisi: string) => {
    switch (kondisi) {
      case "baik":
        return "text-spectrum-jade bg-spectrum-jade/10 border-spectrum-jade/30";
      case "rusak ringan":
        return "text-spectrum-amber bg-spectrum-amber/10 border-spectrum-amber/30";
      case "rusak berat":
        return "text-spectrum-crimson bg-spectrum-crimson/10 border-spectrum-crimson/30";
      case "hilang":
        return "text-red-400 bg-red-500/10 border-red-500/30";
      default:
        return "text-studio-text-secondary bg-surface-3 border-studio-border-subtle";
    }
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
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

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-orbital z-10 my-8 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-studio-border-subtle gap-3">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-spectrum-cyan bg-spectrum-cyan/10 px-2.5 py-1 rounded-md border border-spectrum-cyan/30 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {item.kode_inventaris}
                </span>
                <StatusBadge
                  label={isBorrowed ? "SEDANG DIPINJAM" : "TERSEDIA DI STUDIO"}
                  variant={isBorrowed ? "mandarin" : "jade"}
                />
                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border font-bold ${getKondisiBadgeColor(
                    item.kondisi
                  )}`}
                >
                  Kondisi: {item.kondisi}
                </span>
              </div>
              <h2 id="detail-modal-title" className="text-base sm:text-lg font-bold text-white leading-snug">
                {item.nama_barang}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup detail asset"
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-3 pb-2 border-b border-studio-border-subtle text-xs font-semibold">
            <button
              onClick={() => setActiveTab("detail")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === "detail"
                  ? "bg-spectrum-cobalt text-ink font-bold shadow-cyan"
                  : "text-studio-text-secondary hover:text-white hover:bg-surface-3"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Spesifikasi & Info Aset</span>
            </button>

            <button
              onClick={() => setActiveTab("riwayat")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                activeTab === "riwayat"
                  ? "bg-spectrum-cobalt text-ink font-bold shadow-cyan"
                  : "text-studio-text-secondary hover:text-white hover:bg-surface-3"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Riwayat Peminjaman</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                  activeTab === "riwayat"
                    ? "bg-ink/20 text-ink"
                    : "bg-surface-3 text-studio-text-muted"
                }`}
              >
                {itemLoans.length}
              </span>
            </button>
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto pr-1 py-3 flex-1 space-y-4">
            {activeTab === "detail" ? (
              <div className="space-y-4">
                {/* Status Box */}
                {isBorrowed ? (
                  <div className="p-3.5 rounded-xl bg-spectrum-mandarin/10 border border-spectrum-mandarin/30 text-xs flex items-start gap-3">
                    <Clock className="w-4 h-4 text-spectrum-mandarin shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-white">Perangkat Sedang Dipinjam</p>
                      <p className="text-studio-text-secondary">
                        {item.peminjam_nama
                          ? `Saat ini dipinjam oleh: ${item.peminjam_nama}`
                          : "Perangkat sedang berada di luar studio untuk kegiatan operasional."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-spectrum-jade/10 border border-spectrum-jade/30 text-xs flex items-center gap-2.5 text-spectrum-jade">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Perangkat tersedia di studio dan siap dipinjamkan untuk kegiatan liputan/produksi.</span>
                  </div>
                )}

                {/* Specs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
                    <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-spectrum-cyan" />
                      Kategori Aset
                    </span>
                    <p className="font-bold text-white text-sm">{item.kategori}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
                    <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-orbital-magenta" />
                      Divisi Penanggung Jawab
                    </span>
                    <p className="font-bold text-orbital-magenta text-sm">{item.divisi}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
                    <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-spectrum-lime" />
                      Lokasi Penyimpanan
                    </span>
                    <p className="font-semibold text-white">{item.lokasi_simpan || "Studio Broadcast Spensa"}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
                    <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-spectrum-gold" />
                      Jumlah Unit Terdaftar
                    </span>
                    <p className="font-bold text-white text-sm">{item.jumlah} Unit</p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
                    <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-spectrum-cyan" />
                      Penanggung Jawab Aset
                    </span>
                    <p className="font-semibold text-white">
                      {pjUser?.nama || (item.divisi === "Broadcasting" ? "Ketua Broadcasting" : "Pengurus Studio")}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1">
                    <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-studio-text-secondary" />
                      Tanggal Peroleh / Registrasi
                    </span>
                    <p className="font-semibold text-white">{formatDate(item.created_at || item.tgl_peroleh)}</p>
                  </div>
                </div>

                {/* Additional Note */}
                {item.keterangan && (
                  <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs space-y-1">
                    <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Keterangan / Catatan Kondisi
                    </span>
                    <p className="text-white leading-relaxed">{item.keterangan}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Riwayat Peminjaman Tab */
              <div className="space-y-3">
                {itemLoans.length === 0 ? (
                  <div className="py-12 text-center rounded-xl bg-surface-1 border border-dashed border-studio-border-subtle space-y-2">
                    <History className="w-8 h-8 text-studio-text-muted mx-auto opacity-40" />
                    <p className="text-xs font-semibold text-white">Belum Ada Riwayat Peminjaman</p>
                    <p className="text-[11px] text-studio-text-secondary font-mono max-w-sm mx-auto">
                      Aset ini belum pernah dipinjam atau seluruh sirkulasi terdahulu telah diselesaikan sebelum pencatatan digital.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {itemLoans.map((loan, idx) => {
                      const borrower = anggotaList.find((a) => a.id === loan.anggota_id);
                      const borrowerName =
                        loan.peminjam_nama ||
                        borrower?.nama_lengkap ||
                        "Anggota Studio";
                      const borrowerRole =
                        loan.peminjam_jabatan ||
                        borrower?.jabatan ||
                        (borrower?.kelas ? `Kelas ${borrower.kelas}` : "-");

                      const isCurrentlyActive = !loan.tgl_kembali;

                      return (
                        <div
                          key={loan.id || idx}
                          className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all space-y-2 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-surface-3 flex items-center justify-center font-bold text-white text-[11px]">
                                {idx + 1}
                              </div>
                              <div>
                                <p className="font-bold text-white leading-tight">{borrowerName}</p>
                                <p className="text-[10px] text-studio-text-secondary font-mono">
                                  {borrowerRole}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                                isCurrentlyActive
                                  ? "text-spectrum-mandarin bg-spectrum-mandarin/10 border-spectrum-mandarin/30"
                                  : "text-spectrum-jade bg-spectrum-jade/10 border-spectrum-jade/30"
                              }`}
                            >
                              {isCurrentlyActive ? "SEDANG DIPINJAM" : "SUDAH KEMBALI"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-studio-border-subtle/60 text-[11px] font-mono text-studio-text-secondary">
                            <div>
                              <span className="text-studio-text-muted">Tgl Pinjam: </span>
                              <strong className="text-white">{formatDate(loan.tgl_pinjam)}</strong>
                            </div>
                            <div>
                              <span className="text-studio-text-muted">Tgl Kembali: </span>
                              {loan.tgl_kembali ? (
                                <strong className="text-white">{formatDate(loan.tgl_kembali)}</strong>
                              ) : (
                                <span className="text-spectrum-mandarin">Belum dikembalikan</span>
                              )}
                            </div>
                          </div>

                          {(loan.kondisi_kembali || loan.catatan) && (
                            <div className="pt-1.5 border-t border-studio-border-subtle/60 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                              {loan.kondisi_kembali && (
                                <span className="text-studio-text-secondary">
                                  Kondisi saat kembali:{" "}
                                  <strong className="capitalize text-white">{loan.kondisi_kembali}</strong>
                                </span>
                              )}
                              {loan.catatan && (
                                <span className="text-studio-text-muted italic truncate max-w-xs">
                                  "{loan.catatan}"
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="flex items-center justify-between pt-3 border-t border-studio-border-subtle gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors min-h-[44px]"
            >
              Tutup
            </button>

            {canManage && (
              <div className="flex items-center gap-2">
                {isBorrowed ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReturnLoan(item);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-jade hover:bg-emerald-400 text-ink text-xs font-bold transition-all shadow-jade min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Proses Pengembalian</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onStartLoan(item);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Sirkulasi Pinjamkan Aset</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
