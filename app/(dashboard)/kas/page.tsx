"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { TunggakanDrawer } from "@/components/modules/kas/TunggakanDrawer";
import { KasSettingsModal } from "@/components/modules/kas/KasSettingsModal";
import { calculateKasSummary, getAnggotaTunggakan } from "@/lib/utils/kas-calc";
import { formatIDR } from "@/lib/utils/currency";
import { AnggotaRecord } from "@/lib/mock/store";
import {
  Wallet,
  Check,
  AlertCircle,
  Settings,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Calendar,
} from "lucide-react";

export default function KasPage() {
  const {
    currentUser,
    anggotaList,
    kasSettings,
    kasPembayaranList,
    setKasPembayaranList,
    logAction,
  } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTanggalBayar, setSelectedTanggalBayar] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedAnggotaForDrawer, setSelectedAnggotaForDrawer] =
    useState<AnggotaRecord | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const isBendaharaOrAdmin =
    currentUser.role === "bendahara" || currentUser.role === "administrator";
  const isKetuaOrAdmin =
    currentUser.role === "ketua_broadcast" || currentUser.role === "administrator";

  const summary = calculateKasSummary(kasPembayaranList);

  // Extract distinct periods
  const periods = Array.from(
    new Set(kasPembayaranList.map((p) => p.periode_label))
  );

  // Filter members by query
  const filteredAnggota = anggotaList.filter((a) =>
    a.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle Single Period Payment
  const handleTogglePayment = (anggotaId: string, periodeLabel: string) => {
    if (!isBendaharaOrAdmin) {
      alert("Hanya Bendahara yang memiliki otorisasi mencatat pembayaran iuran kas!");
      return;
    }

    setKasPembayaranList((prev) =>
      prev.map((item) => {
        if (item.anggota_id === anggotaId && item.periode_label === periodeLabel) {
          const nextStatus = item.status === "lunas" ? "belum" : "lunas";
          return {
            ...item,
            status: nextStatus,
            tanggal_bayar:
              nextStatus === "lunas"
                ? new Date(selectedTanggalBayar).toISOString()
                : undefined,
            dicatat_oleh: nextStatus === "lunas" ? currentUser.id : undefined,
          };
        }
        return item;
      })
    );

    const targetAnggota = anggotaList.find((a) => a.id === anggotaId);
    logAction(
      "TOGGLE_KAS_CHECKBOX",
      "kas_pembayaran",
      anggotaId,
      `Bendahara mengubah status ${periodeLabel} untuk ${targetAnggota?.nama_lengkap} (Tanggal: ${selectedTanggalBayar})`
    );
  };

  const handleExportCSV = () => {
    const headers = ["Nama Siswa", "Kelas", "Divisi", "Total Tunggakan", "Status"];
    const rows = anggotaList.map((ang) => {
      const arrears = getAnggotaTunggakan(kasPembayaranList, ang.id);
      const totalArrears = arrears.reduce((sum, item) => sum + item.nominal, 0);
      return [
        ang.nama_lengkap,
        ang.kelas,
        ang.divisi || "-",
        totalArrears.toString(),
        totalArrears === 0 ? "Lunas" : "Tertunggak",
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Kas_Spensa_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wallet className="w-5 h-5 text-spectrum-jade" />
            Buku Kas Anggota & Matriks Iuran
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Pelacakan iuran periodik dengan mekanisme Instant Checkbox dan Selective Arrears Drawer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            aria-label="Export data kas ke CSV"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-white text-xs font-semibold transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4 text-spectrum-cobalt" />
            <span>Ekspor CSV</span>
          </button>

          {isKetuaOrAdmin && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              aria-label="Atur tarif iuran kas"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-amber hover:bg-amber-400 text-surface-1 text-xs font-bold transition-all shadow-amber min-h-[44px]"
            >
              <Settings className="w-4 h-4" />
              <span>Atur Iuran ({formatIDR(kasSettings.nominal)})</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-spectrum-jade/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-mono font-bold text-spectrum-jade uppercase">
            Total Kas Terkumpul (Saldo)
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(summary.totalTerkumpul)}
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            {summary.jumlahTransaksiLunas} pembayaran terkonfirmasi
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-spectrum-tangerine/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-mono font-bold text-spectrum-tangerine uppercase">
            Total Piutang Tertunggak
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(summary.totalTertunggak)}
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            {summary.jumlahTransaksiTertunggak} kewajiban belum lunas
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-cyan uppercase">
            Kepatuhan Iuran
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {summary.jumlahTransaksiLunas + summary.jumlahTransaksiTertunggak > 0
              ? `${Math.round(
                  (summary.jumlahTransaksiLunas /
                    (summary.jumlahTransaksiLunas +
                      summary.jumlahTransaksiTertunggak)) *
                    100
                )}%`
              : "0%"}
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Aturan: {formatIDR(kasSettings.nominal)} / {kasSettings.periode_type}
          </p>
        </div>
      </div>

      {/* Kas Checkbox Matrix Grid */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-4 lg:p-6 space-y-4">
        {/* Search Bar & Tanggal Bayar Input */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-studio-border-subtle">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Cari nama anggota atau kelas"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari anggota atau kelas..."
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-jade focus:outline-none min-h-[40px]"
              />
            </div>

            {/* Input Tanggal Bayar Kas */}
            <div className="flex items-center gap-2 bg-surface-2 border border-studio-border-subtle px-3 py-1.5 rounded-lg min-h-[40px]">
              <Calendar className="w-4 h-4 text-spectrum-jade flex-shrink-0" />
              <div className="flex items-center gap-2">
                <label htmlFor="kas-tgl-input" className="text-[11px] font-mono font-bold text-studio-text-secondary whitespace-nowrap">
                  Tanggal Bayar:
                </label>
                <input
                  id="kas-tgl-input"
                  type="date"
                  value={selectedTanggalBayar}
                  onChange={(e) => setSelectedTanggalBayar(e.target.value)}
                  className="bg-surface-1 border border-studio-border-subtle px-2 py-0.5 rounded text-xs font-mono font-bold text-white focus:border-spectrum-jade focus:outline-none cursor-pointer"
                  title="Pilih tanggal aktual pencatatan pembayaran kas"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-studio-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-spectrum-jade flex items-center justify-center text-white">
                <Check className="w-2.5 h-2.5" />
              </span>
              <span>Lunas</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-studio-border-medium bg-surface-2" />
              <span>Belum</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border border-spectrum-tangerine bg-spectrum-tangerine/10" />
              <span>Tertunggak</span>
            </span>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="border-b border-studio-border-subtle text-[11px] font-mono uppercase text-studio-text-secondary">
                <th className="py-3 px-3">Nama Anggota</th>
                <th className="py-3 px-2">Kelas</th>
                <th className="py-3 px-2">Divisi</th>
                {periods.map((p) => (
                  <th key={p} className="py-3 px-2 text-center">
                    {p}
                  </th>
                ))}
                <th className="py-3 px-3 text-right">Status / Tunggakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border-subtle text-xs">
              {filteredAnggota.map((ang) => {
                const arrears = getAnggotaTunggakan(kasPembayaranList, ang.id);
                const isIndebted = arrears.length > 0;

                return (
                  <tr
                    key={ang.id}
                    className="hover:bg-surface-2/60 transition-colors group"
                  >
                    <td className="py-3 px-3">
                      <button
                        onClick={() => setSelectedAnggotaForDrawer(ang)}
                        aria-label={`Buka drawer tunggakan untuk ${ang.nama_lengkap}`}
                        className="font-bold text-white hover:text-spectrum-cyan flex items-center gap-2 group-hover:underline text-left"
                      >
                        <span>{ang.nama_lengkap}</span>
                        {isIndebted && (
                          <span className="px-1.5 py-0.5 rounded bg-spectrum-tangerine/20 text-spectrum-tangerine text-[10px] font-mono font-bold">
                            {arrears.length}x
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-3 px-2 font-mono text-studio-text-secondary">
                      {ang.kelas}
                    </td>
                    <td className="py-3 px-2 text-studio-text-secondary">
                      {ang.divisi || "Umum"}
                    </td>

                    {/* Period Checkboxes */}
                    {periods.map((p) => {
                      const record = kasPembayaranList.find(
                        (k) => k.anggota_id === ang.id && k.periode_label === p
                      );
                      const isLunas = record?.status === "lunas";

                      return (
                        <td key={p} className="py-3 px-2 text-center">
                          <button
                            onClick={() => handleTogglePayment(ang.id, p)}
                            aria-label={`Tandai bayar ${p} untuk ${ang.nama_lengkap}`}
                            title={
                              isLunas
                                ? `Lunas (${
                                    record?.tanggal_bayar
                                      ? new Date(record.tanggal_bayar).toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })
                                      : "Tercatat"
                                  })`
                                : `Klik untuk lunasi dengan tanggal ${selectedTanggalBayar}`
                            }
                            className={`w-7 h-7 mx-auto rounded-md flex items-center justify-center transition-all ${
                              isLunas
                                ? "bg-spectrum-jade text-white shadow-jade"
                                : isIndebted
                                ? "border-2 border-spectrum-tangerine bg-spectrum-tangerine/10 text-spectrum-tangerine hover:bg-spectrum-tangerine/20"
                                : "border border-studio-border-medium bg-surface-2 hover:border-spectrum-cyan"
                            }`}
                          >
                            {isLunas && <Check className="w-4 h-4 stroke-[3]" />}
                          </button>
                          {isLunas && record?.tanggal_bayar && (
                            <span className="block text-[8px] font-mono text-studio-text-muted mt-0.5 leading-none">
                              {new Date(record.tanggal_bayar).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "numeric",
                              })}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right">
                      {isIndebted ? (
                        <button
                          onClick={() => setSelectedAnggotaForDrawer(ang)}
                          className="px-2.5 py-1 rounded bg-spectrum-tangerine/15 text-spectrum-tangerine text-[11px] font-bold border border-spectrum-tangerine/30 hover:bg-spectrum-tangerine/25 transition-colors"
                        >
                          Hutang {formatIDR(arrears.reduce((s, i) => s + i.nominal, 0))}
                        </button>
                      ) : (
                        <span className="text-[11px] font-mono font-bold text-spectrum-jade">
                          ✓ Lunas
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tunggakan Drawer Component */}
      {selectedAnggotaForDrawer && (
        <TunggakanDrawer
          anggota={selectedAnggotaForDrawer}
          tunggakanList={getAnggotaTunggakan(
            kasPembayaranList,
            selectedAnggotaForDrawer.id
          )}
          isOpen={true}
          onClose={() => setSelectedAnggotaForDrawer(null)}
        />
      )}

      {/* Kas Settings Modal */}
      <KasSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

