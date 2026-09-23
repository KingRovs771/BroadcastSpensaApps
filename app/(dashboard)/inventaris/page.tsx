"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { InventarisItem, DivisiName } from "@/lib/mock/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import {
  Archive,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InventarisPage() {
  const {
    currentUser,
    inventarisList,
    anggotaList,
    refreshData,
    logAction,
    supabase,
  } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivisi, setSelectedDivisi] = useState<string>("all");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedForLoan, setSelectedForLoan] = useState<InventarisItem | null>(null);
  const [selectedBorrower, setSelectedBorrower] = useState(anggotaList[0]?.id || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new item
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("Kamera");
  const [kodeInventaris, setKodeInventaris] = useState("BRC-VID-002");
  const [jumlah, setJumlah] = useState(1);
  const [kondisi, setKondisi] = useState<InventarisItem["kondisi"]>("baik");
  const [lokasi, setLokasi] = useState("Studio A");
  const [divisi, setDivisi] = useState<DivisiName>("Videografer");

  const isBroadcastingOrSekretarisOrAdmin =
    (currentUser.role === "ketua_divisi" && currentUser.divisi === "Broadcasting") ||
    currentUser.role === "sekretaris" ||
    currentUser.role === "ketua_broadcast" ||
    currentUser.role === "administrator";

  const filteredItems = inventarisList.filter((item) => {
    const matchesSearch =
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode_inventaris.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDivisi =
      selectedDivisi === "all" ? true : item.divisi === selectedDivisi;
    return matchesSearch && matchesDivisi;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("inventaris")
        .insert({
          nama_barang: namaBarang,
          kategori,
          kode_inventaris: kodeInventaris,
          jumlah: Number(jumlah),
          kondisi,
          lokasi_simpan: lokasi,
          divisi,
          status: "tersedia",
          penanggung_jawab: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert inventaris error:", error);
        alert(`Gagal menambah barang: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      await refreshData();
      logAction(
        "CREATE_INVENTARIS",
        "inventaris",
        data?.id || "new",
        `Menambahkan aset studio baru: ${namaBarang} (${kodeInventaris})`
      );

      setNamaBarang("");
      setIsNewModalOpen(false);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLoan = async (item: InventarisItem) => {
    if (item.status === "tersedia") {
      // Open modal to select borrower
      setSelectedForLoan(item);
    } else {
      // Returning item
      const returnKondisi = prompt("Kondisi saat kembali (baik / rusak ringan / hilang):", "baik");
      if (!returnKondisi) return;

      try {
        const { error } = await supabase
          .from("inventaris")
          .update({
            status: "tersedia",
            kondisi: (returnKondisi as any) || "baik",
            keterangan: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        if (error) {
          console.error("Supabase return inventaris error:", error);
          alert(`Gagal memproses pengembalian: ${error.message}`);
          return;
        }

        await refreshData();
        logAction(
          "RETURN_INVENTARIS",
          "inventaris",
          item.id,
          `Pengembalian aset ${item.nama_barang} (kondisi: ${returnKondisi})`
        );
      } catch (err: any) {
        alert(`Terjadi kesalahan: ${err.message || err}`);
      }
    }
  };

  const handleConfirmLoan = async () => {
    if (!selectedForLoan) return;

    const borrower = anggotaList.find((u) => u.id === selectedBorrower);
    const borrowerName = borrower ? `${borrower.nama_lengkap} (${borrower.jabatan ?? "-"})` : "Anggota";

    try {
      const { error: invErr } = await supabase
        .from("inventaris")
        .update({
          status: "dipinjam",
          keterangan: `Dipinjam oleh ${borrowerName}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedForLoan.id);

      if (invErr) {
        console.error("Supabase loan inventaris error:", invErr);
        alert(`Gagal meminjamkan aset: ${invErr.message}`);
        return;
      }

      // Also record in inventaris_peminjaman
      if (selectedBorrower) {
        await supabase.from("inventaris_peminjaman").insert({
          inventaris_id: selectedForLoan.id,
          anggota_id: selectedBorrower,
          jumlah_pinjam: 1,
          tgl_pinjam: new Date().toISOString().split("T")[0],
          dicatat_oleh: currentUser.id,
        });
      }

      await refreshData();
      logAction(
        "BORROW_INVENTARIS",
        "inventaris",
        selectedForLoan.id,
        `Peminjaman aset ${selectedForLoan.nama_barang} oleh ${borrower?.nama_lengkap || selectedBorrower}`
      );

      setSelectedForLoan(null);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-spectrum-cyan" />
            Inventaris Aset Studio & Sirkulasi
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Penomoran terstandarisasi BRC, pelacakan kondisi perangkat studio, dan sirkulasi peminjaman.
          </p>
        </div>

        {isBroadcastingOrSekretarisOrAdmin && (
          <button
            onClick={() => setIsNewModalOpen(true)}
            aria-label="Registrasi Aset Baru"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Registrasi Aset Baru</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-1 p-4 rounded-2xl border border-studio-border-subtle">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Cari barang atau kode inventaris"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kamera, mic, atau kode BRC..."
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="inv-filter-divisi" className="text-xs font-mono text-studio-text-muted">
            Divisi:
          </label>
          <select
            id="inv-filter-divisi"
            value={selectedDivisi}
            onChange={(e) => setSelectedDivisi(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
          >
            <option value="all">Semua Divisi</option>
            {DIVISI_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Inventory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isBorrowed = item.status === "dipinjam";

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-spectrum-cyan bg-surface-2 px-2.5 py-1 rounded-md border border-studio-border-subtle">
                    {item.kode_inventaris}
                  </span>
                  <StatusBadge
                    label={isBorrowed ? "SEDANG DIPINJAM" : "TERSEDIA"}
                    variant={isBorrowed ? "mandarin" : "jade"}
                  />
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {item.nama_barang}
                </h3>

                <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle space-y-1.5 text-xs">
                  <div className="flex justify-between text-studio-text-secondary">
                    <span>Kategori:</span>
                    <strong className="text-white">{item.kategori}</strong>
                  </div>
                  <div className="flex justify-between text-studio-text-secondary">
                    <span>Kondisi Fisik:</span>
                    <span
                      className={`font-mono font-bold capitalize ${
                        item.kondisi === "baik"
                          ? "text-spectrum-jade"
                          : "text-spectrum-tangerine"
                      }`}
                    >
                      {item.kondisi}
                    </span>
                  </div>
                  <div className="flex justify-between text-studio-text-secondary">
                    <span>Lokasi Simpan:</span>
                    <span className="text-white truncate max-w-[150px]">
                      {item.lokasi_simpan}
                    </span>
                  </div>
                  <div className="flex justify-between text-studio-text-secondary">
                    <span>Divisi Pemegang:</span>
                    <span className="text-orbital-magenta font-semibold">
                      {item.divisi}
                    </span>
                  </div>
                  {item.peminjam_nama && (
                    <div className="pt-1.5 border-t border-studio-border-subtle text-[11px] text-spectrum-mandarin font-mono">
                      Peminjam: {item.peminjam_nama}
                    </div>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="pt-3 border-t border-studio-border-subtle flex items-center justify-between">
                <span className="text-[11px] font-mono text-studio-text-muted">
                  Jumlah: {item.jumlah} Unit
                </span>

                <button
                  onClick={() => handleToggleLoan(item)}
                  aria-label={isBorrowed ? "Kembalikan barang" : "Pinjam barang"}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                    isBorrowed
                      ? "bg-spectrum-jade hover:bg-emerald-500 text-ink shadow-jade"
                      : "bg-surface-2 hover:bg-surface-3 text-studio-text-secondary hover:text-white border border-studio-border-subtle"
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>{isBorrowed ? "Proses Kembali" : "Sirkulasi Pinjam"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Registrasi Aset Baru */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="inv-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsNewModalOpen(false)}
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
                <h3 id="inv-modal-title" className="text-base font-bold text-white">
                  Registrasi Aset Studio Baru
                </h3>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  aria-label="Tutup modal"
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label htmlFor="inv-nama" className="block text-xs font-semibold text-white mb-1">
                  Nama Barang / Perangkat *
                </label>
                <input
                  id="inv-nama"
                  type="text"
                  required
                  value={namaBarang}
                  onChange={(e) => setNamaBarang(e.target.value)}
                  placeholder="Contoh: Sony Alpha 7 IV / Tripod Benro"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-kode" className="block text-xs font-semibold text-white mb-1">
                    Kode Tagging BRC *
                  </label>
                  <input
                    id="inv-kode"
                    type="text"
                    required
                    value={kodeInventaris}
                    onChange={(e) => setKodeInventaris(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="inv-kat" className="block text-xs font-semibold text-white mb-1">
                    Kategori Free-Text *
                  </label>
                  <input
                    id="inv-kat"
                    type="text"
                    required
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    placeholder="Kamera, Lighting, Mic"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inv-div" className="block text-xs font-semibold text-white mb-1">
                    Divisi Pemegang *
                  </label>
                  <select
                    id="inv-div"
                    value={divisi}
                    onChange={(e) => setDivisi(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  >
                    {DIVISI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="inv-lokasi" className="block text-xs font-semibold text-white mb-1">
                    Lokasi Simpan
                  </label>
                  <input
                    id="inv-lokasi"
                    type="text"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    placeholder="Dry Cabinet Studio"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-ink bg-spectrum-cobalt hover:bg-sky-400 rounded-lg transition-all shadow-cyan min-h-[44px]"
                >
                  Simpan Aset
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Modal Sirkulasi Peminjaman */}
      <AnimatePresence>
        {selectedForLoan && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="loan-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedForLoan(null)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-sm w-full p-6 shadow-orbital z-10"
            >
              <h3 id="loan-modal-title" className="text-base font-bold text-white">
                Peminjaman Aset Studio
              </h3>
              <p className="text-xs text-studio-text-secondary mt-1">
                Barang: <strong className="text-white">{selectedForLoan.nama_barang}</strong> ({selectedForLoan.kode_inventaris})
              </p>

              <div className="mt-4">
                <label htmlFor="loan-peminjam" className="block text-xs font-semibold text-white mb-1">
                  Pilih Anggota Peminjam *
                </label>
                <select
                  id="loan-peminjam"
                  value={selectedBorrower}
                  onChange={(e) => setSelectedBorrower(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                >
                  {anggotaList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nama_lengkap} ({u.jabatan})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-studio-border-subtle mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedForLoan(null)}
                  className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLoan}
                  className="px-5 py-2 text-xs font-bold text-ink bg-spectrum-mandarin hover:bg-orange-400 rounded-lg transition-all min-h-[44px]"
                >
                  Konfirmasi Pinjam
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

