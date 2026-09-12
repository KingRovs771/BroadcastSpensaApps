"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { KeuanganPembinaItem } from "@/lib/mock/store";
import { formatIDR } from "@/lib/utils/currency";
import {
  Lock,
  Plus,
  ShieldAlert,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  AlertTriangle,
  FileCheck2,
  DollarSign,
  X,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KeuanganPembinaPage() {
  const { currentUser, keuanganPembinaList, setKeuanganPembinaList, logAction } =
    useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sumberDana, setSumberDana] = useState<"BOS" | "Dana Sekolah" | "Sponsor">("BOS");
  const [tipeTransaksi, setTipeTransaksi] = useState<"masuk" | "keluar">("masuk");
  const [nominal, setNominal] = useState(0);
  const [keterangan, setKeterangan] = useState("");
  const [catatan, setCatatan] = useState("");

  const isPrivileged = [
    "pembina",
    "ketua_broadcast",
    "bendahara",
    "administrator",
  ].includes(currentUser.role);

  const isPembinaOrAdmin =
    currentUser.role === "pembina" || currentUser.role === "administrator";

  // If role is unauthorized, render zero-leakage 403 screen per PRD & AGENTS.md
  if (!isPrivileged) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="w-16 h-16 rounded-full bg-spectrum-tangerine/15 border border-spectrum-tangerine/30 flex items-center justify-center text-spectrum-tangerine">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white">
          403 Forbidden · Akses Dibatasi
        </h2>
        <p className="text-xs text-studio-text-secondary max-w-md">
          Buku Catatan Keuangan Pembina merupakan buku besar terisolasi (*air-gapped ledger*) khusus dana operasional sekolah (BOS/Sponsor). Modul ini hanya dapat diakses oleh Pembina, Ketua Broadcast, dan Bendahara.
        </p>
        <span className="text-[10px] font-mono text-studio-text-muted">
          Akun aktif: {currentUser.nama} ({currentUser.role})
        </span>
      </div>
    );
  }

  // Calculate totals
  const totalPemasukan = keuanganPembinaList.reduce((sum, item) => sum + item.pemasukan, 0);
  const totalPengeluaran = keuanganPembinaList.reduce((sum, item) => sum + item.pengeluaran, 0);
  const saldoBersih = totalPemasukan - totalPengeluaran;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const newItem: KeuanganPembinaItem = {
      id: `kp-${Date.now()}`,
      tanggal: new Date().toISOString().split("T")[0],
      sumber_dana: sumberDana,
      keterangan,
      pemasukan: tipeTransaksi === "masuk" ? nominal : 0,
      pengeluaran: tipeTransaksi === "keluar" ? nominal : 0,
      catatan_pembina: catatan || undefined,
    };

    setKeuanganPembinaList((prev) => [newItem, ...prev]);
    logAction(
      "CREATE_KEUANGAN_PEMBINA",
      "keuangan_pembina",
      newItem.id,
      `Pembina mencatat ${tipeTransaksi === "masuk" ? "pemasukan" : "pengeluaran"} ${formatIDR(nominal)}: ${keterangan}`
    );

    setNominal(0);
    setKeterangan("");
    setCatatan("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-orbital-magenta" />
              Buku Catatan Keuangan Pembina
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/30">
              AIR-GAPPED
            </span>
          </div>
          <p className="text-xs text-studio-text-secondary mt-1">
            Buku besar terisolasi khusus dana operasional sekolah (BOS, Subsidi Komite, Sponsor).
          </p>
        </div>

        {isPembinaOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Catat Transaksi Kas Pembina"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orbital-violet hover:bg-orbital-magenta text-ink text-xs font-bold transition-all shadow-orbital min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi Baru</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-spectrum-jade/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-mono font-bold text-spectrum-jade uppercase flex items-center gap-1">
            <ArrowDownLeft className="w-3.5 h-3.5" /> Total Pemasukan
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(totalPemasukan)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-spectrum-tangerine/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-mono font-bold text-spectrum-tangerine uppercase flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> Total Pengeluaran
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(totalPengeluaran)}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-orbital-magenta uppercase flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Saldo Dana Pembina
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(saldoBersih)}
          </p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
            Mutasi Kas Masuk & Keluar Pembina
          </h3>
          <span className="text-[11px] font-mono text-studio-text-muted">
            {keuanganPembinaList.length} Transaksi Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-studio-border-subtle text-[11px] font-mono uppercase text-studio-text-secondary">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-2">Sumber Dana</th>
                <th className="py-3 px-3">Keterangan Transaksi</th>
                <th className="py-3 px-3 text-right">Pemasukan</th>
                <th className="py-3 px-3 text-right">Pengeluaran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border-subtle text-xs">
              {keuanganPembinaList.map((item) => (
                <tr key={item.id} className="hover:bg-surface-2/60 transition-colors">
                  <td className="py-3 px-3 font-mono text-studio-text-muted whitespace-nowrap">
                    {item.tanggal}
                  </td>
                  <td className="py-3 px-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-surface-2 text-white border border-studio-border-subtle">
                      {item.sumber_dana}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-white">{item.keterangan}</p>
                    {item.catatan_pembina && (
                      <p className="text-[11px] text-studio-text-secondary italic mt-0.5">
                        "{item.catatan_pembina}"
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-spectrum-jade">
                    {item.pemasukan > 0 ? `+${formatIDR(item.pemasukan)}` : "-"}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-spectrum-tangerine">
                    {item.pengeluaran > 0 ? `-${formatIDR(item.pengeluaran)}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Catat Transaksi Baru */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="keuangan-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
                <h3 id="keuangan-modal-title" className="text-base font-bold text-white">
                  Catat Mutasi Kas Pembina
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Tutup modal"
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTipeTransaksi("masuk")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      tipeTransaksi === "masuk"
                        ? "bg-spectrum-jade/20 border-spectrum-jade text-spectrum-jade"
                        : "border-studio-border-subtle text-studio-text-secondary hover:text-white"
                    }`}
                  >
                    + Pemasukan Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipeTransaksi("keluar")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      tipeTransaksi === "keluar"
                        ? "bg-spectrum-tangerine/20 border-spectrum-tangerine text-spectrum-tangerine"
                        : "border-studio-border-subtle text-studio-text-secondary hover:text-white"
                    }`}
                  >
                    - Pengeluaran / Belanja
                  </button>
                </div>

                <div>
                  <label htmlFor="kp-sumber" className="block text-xs font-semibold text-white mb-1">
                    Sumber Dana *
                  </label>
                  <select
                    id="kp-sumber"
                    value={sumberDana}
                    onChange={(e) => setSumberDana(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none min-h-[44px]"
                  >
                    <option value="BOS">BOS (Bantuan Operasional Sekolah)</option>
                    <option value="Dana Sekolah">Dana Subsidi Sekolah / Komite</option>
                    <option value="Sponsor">Sponsor Eksternal / Hibah</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="kp-nominal" className="block text-xs font-semibold text-white mb-1">
                    Nominal Transaksi (Rp) *
                  </label>
                  <input
                    id="kp-nominal"
                    type="number"
                    min={1000}
                    required
                    value={nominal || ""}
                    onChange={(e) => setNominal(Number(e.target.value))}
                    placeholder="Contoh: 1500000"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-sm font-mono text-white focus:border-orbital-violet focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="kp-keterangan" className="block text-xs font-semibold text-white mb-1">
                    Keterangan Transaksi *
                  </label>
                  <input
                    id="kp-keterangan"
                    type="text"
                    required
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: Pengadaan 2 unit SSD Master Video"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label htmlFor="kp-catatan" className="block text-xs font-semibold text-white mb-1">
                    Catatan Pembina (Opsional)
                  </label>
                  <textarea
                    id="kp-catatan"
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Catatan verifikasi nota atau persetujuan kepala sekolah..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-ink bg-orbital-violet hover:bg-orbital-magenta rounded-lg transition-all shadow-orbital min-h-[44px]"
                  >
                    Simpan ke Ledger
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
