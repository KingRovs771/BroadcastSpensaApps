"use client";

import React, { useState } from "react";
import { AnggotaRecord, KasPembayaran } from "@/lib/mock/store";
import { formatIDR } from "@/lib/utils/currency";
import { useSession } from "@/components/shared/SessionContext";
import { X, AlertTriangle, CheckCheck, Calendar } from "lucide-react";

import { motion, AnimatePresence } from "framer-motion";

interface TunggakanDrawerProps {
  anggota: AnggotaRecord | null;
  tunggakanList: KasPembayaran[];
  isOpen: boolean;
  onClose: () => void;
}

export function TunggakanDrawer({
  anggota,
  tunggakanList,
  isOpen,
  onClose,
}: TunggakanDrawerProps) {
  const { setKasPembayaranList, logAction, currentUser } = useSession();

  const [tanggalBayar, setTanggalBayar] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  if (!isOpen || !anggota) return null;

  const totalTunggakan = tunggakanList.reduce((sum, item) => sum + item.nominal, 0);

  const handleSettleSingle = (id: string, periodeLabel: string) => {
    setKasPembayaranList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "lunas",
              tanggal_bayar: tanggalBayar,
              dicatat_oleh: currentUser.nama,
            }
          : item
      )
    );
    logAction(
      "bayar_kas",
      "kas_pembayaran",
      `Pembayaran kas tertunggak ${periodeLabel} anggota ${anggota.nama_lengkap} dicatat lunas pada tanggal ${tanggalBayar}`
    );
  };

  const handleSettleAll = () => {
    const tunggakanIds = tunggakanList.map((t) => t.id);
    setKasPembayaranList((prev) =>
      prev.map((item) =>
        tunggakanIds.includes(item.id)
          ? {
              ...item,
              status: "lunas",
              tanggal_bayar: tanggalBayar,
              dicatat_oleh: currentUser.nama,
            }
          : item
      )
    );
    logAction(
      "quick_settle_kas",
      "kas_pembayaran",
      `Quick Settle borongan kas ${tunggakanList.length} periode (${formatIDR(
        totalTunggakan
      )}) anggota ${anggota.nama_lengkap} dicatat lunas pada tanggal ${tanggalBayar}`
    );
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tunggakan-title"
        className="fixed inset-0 z-50 flex justify-end"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-cosmic/75 backdrop-blur-sm"
        />

        {/* Drawer Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md bg-surface-2 border-l border-studio-border-medium h-full flex flex-col p-6 shadow-2xl z-10"
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-spectrum-tangerine" />
              <div>
                <h3 id="tunggakan-title" className="text-base font-bold text-white">
                  Rincian Tunggakan Kas
                </h3>
                <p className="text-xs text-studio-text-secondary">
                  {anggota.nama_lengkap} ({anggota.kelas})
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Tutup drawer"
              className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Arrears Summary Card */}
          <div className="my-4 p-4 rounded-xl bg-spectrum-tangerine/10 border border-spectrum-tangerine/30">
            <span className="text-[10px] font-mono font-bold text-spectrum-tangerine uppercase">
              Total Kewajiban Tertunggak
            </span>
            <p className="text-2xl font-mono font-black text-spectrum-tangerine mt-1">
              {formatIDR(totalTunggakan)}
            </p>
            <p className="text-xs text-studio-text-muted mt-1">
              {tunggakanList.length} periode pembayaran belum terselesaikan.
            </p>
          </div>

          {/* Custom Date Input for Tunggakan Payment */}
          <div className="mb-4 p-3 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-1.5">
            <label className="text-[11px] font-bold text-studio-text-secondary flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-spectrum-cyan" />
              Tanggal Transaksi Pelunasan:
            </label>
            <input
              type="date"
              aria-label="Tanggal Pembayaran Tunggakan"
              value={tanggalBayar}
              onChange={(e) => setTanggalBayar(e.target.value)}
              className="w-full bg-surface-2 border border-studio-border-subtle rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-spectrum-cyan"
            />
            <p className="text-[10px] text-studio-text-muted">
              Pilih tanggal saat anggota melunasi kas tertunggak ini.
            </p>
          </div>

          {/* Arrears List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <h4 className="text-xs font-bold text-studio-text-secondary uppercase tracking-wider mb-2">
              Daftar Periode Belum Lunas
            </h4>
            {tunggakanList.length === 0 ? (
              <div className="text-center py-8 text-studio-text-muted text-xs">
                Tidak ada tunggakan kas. Semua lunas! 🎉
              </div>
            ) : (
              tunggakanList.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-surface-1 border border-studio-border-subtle flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{item.periode_label}</p>
                    <p className="text-[10px] text-studio-text-muted font-mono">
                      {item.periode_start} s/d {item.periode_end}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">
                      {formatIDR(item.nominal)}
                    </span>
                    <button
                      onClick={() => handleSettleSingle(item.id, item.periode_label)}
                      aria-label={`Lunasi tunggakan ${item.periode_label}`}
                      className="px-2 py-1 rounded bg-spectrum-jade/20 hover:bg-spectrum-jade/30 text-spectrum-jade text-[11px] font-bold border border-spectrum-jade/30 transition-colors"
                    >
                      Bayar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Bottom Actions */}
          {tunggakanList.length > 0 && (
            <div className="pt-4 border-t border-studio-border-subtle space-y-2">
              <button
                onClick={handleSettleAll}
                aria-label="Lunasi seluruh tunggakan sekaligus"
                className="w-full py-3 px-4 rounded-xl bg-spectrum-jade hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-jade transition-all min-h-[48px]"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Quick Settle Borongan ({formatIDR(totalTunggakan)})</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
