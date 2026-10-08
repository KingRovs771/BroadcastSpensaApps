"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { InventarisItem, InventarisPeminjaman, DivisiName } from "@/lib/mock/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import { generateAutoKodeInventaris } from "@/lib/utils/inventaris";
import { DetailInventarisModal } from "@/components/modules/inventaris/DetailInventarisModal";
import { ReturnInventarisModal } from "@/components/modules/inventaris/ReturnInventarisModal";
import {
  Archive,
  Plus,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  Search,
  Layers,
  Lock,
  Info,
  History,
  Calendar,
  Clock,
  User,
  Tag,
  Loader2,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function InventarisPage() {
  const {
    currentUser,
    inventarisList,
    setInventarisList,
    inventarisPeminjamanList,
    setInventarisPeminjamanList,
    anggotaList,
    allUsers,
    refreshData,
    logAction,
    supabase,
  } = useSession();

  // Page view tabs: "katalog" (grid of assets) | "riwayat" (all loan history)
  const [activeViewTab, setActiveViewTab] = useState<"katalog" | "riwayat">("katalog");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivisi, setSelectedDivisi] = useState<string>("all");
  const [selectedKondisiFilter, setSelectedKondisiFilter] = useState<string>("all");

  // Modals state
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<InventarisItem | null>(null);
  const [selectedForLoan, setSelectedForLoan] = useState<InventarisItem | null>(null);
  const [selectedForReturn, setSelectedForReturn] = useState<InventarisItem | null>(null);

  // Loan form state
  const [selectedBorrower, setSelectedBorrower] = useState(anggotaList[0]?.id || "");
  const [loanCatatan, setLoanCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for new item
  const [namaBarang, setNamaBarang] = useState("");
  const [kategori, setKategori] = useState("Kamera");
  const [divisi, setDivisi] = useState<DivisiName>("Videografer");
  const [kodeInventaris, setKodeInventaris] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [kondisi, setKondisi] = useState<InventarisItem["kondisi"]>("baik");
  const [lokasi, setLokasi] = useState("Studio A");

  const isBroadcastingOrSekretarisOrAdmin =
    (currentUser.role === "ketua_divisi" && currentUser.divisi === "Broadcasting") ||
    currentUser.role === "sekretaris" ||
    currentUser.role === "ketua_broadcast" ||
    currentUser.role === "pembina" ||
    currentUser.role === "administrator" ||
    (currentUser.role as string) === "admin";

  // Auto-generate Kode Tagging BRC-* saat membuka modal atau saat divisi/kategori berubah
  useEffect(() => {
    if (isNewModalOpen) {
      const autoCode = generateAutoKodeInventaris(inventarisList, divisi, kategori);
      setKodeInventaris(autoCode);
    }
  }, [isNewModalOpen, divisi, kategori, inventarisList]);

  // Set default borrower saat anggotaList tersedia
  useEffect(() => {
    if (anggotaList.length > 0 && !selectedBorrower) {
      setSelectedBorrower(anggotaList[0].id);
    }
  }, [anggotaList, selectedBorrower]);

  // Update selectedDetailItem jika data inventarisList berubah
  useEffect(() => {
    if (selectedDetailItem) {
      const updated = inventarisList.find((i) => i.id === selectedDetailItem.id);
      if (updated) setSelectedDetailItem(updated);
    }
  }, [inventarisList, selectedDetailItem]);

  const filteredItems = inventarisList.filter((item) => {
    const matchesSearch =
      item.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kode_inventaris.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.lokasi_simpan && item.lokasi_simpan.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDivisi = selectedDivisi === "all" ? true : item.divisi === selectedDivisi;
    const matchesKondisi =
      selectedKondisiFilter === "all" ? true : item.kondisi === selectedKondisiFilter;
    return matchesSearch && matchesDivisi && matchesKondisi;
  });

  // Filtered loan history for global history tab
  const filteredLoans = inventarisPeminjamanList.filter((loan) => {
    const asset = inventarisList.find((i) => i.id === loan.inventaris_id);
    const borrower = anggotaList.find((a) => a.id === loan.anggota_id);
    const query = searchQuery.toLowerCase();

    return (
      (loan.peminjam_nama && loan.peminjam_nama.toLowerCase().includes(query)) ||
      (borrower?.nama_lengkap && borrower.nama_lengkap.toLowerCase().includes(query)) ||
      (asset?.nama_barang && asset.nama_barang.toLowerCase().includes(query)) ||
      (asset?.kode_inventaris && asset.kode_inventaris.toLowerCase().includes(query)) ||
      (loan.kode_inventaris && loan.kode_inventaris.toLowerCase().includes(query)) ||
      (loan.catatan && loan.catatan.toLowerCase().includes(query))
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Pastikan kode selalu dihitung terstandarisasi
    const finalKode =
      kodeInventaris || generateAutoKodeInventaris(inventarisList, divisi, kategori);

    try {
      const uploaderId = currentUser.id && currentUser.id.length === 36 ? currentUser.id : null;

      const { data, error } = await supabase
        .from("inventaris")
        .insert({
          nama_barang: namaBarang.trim(),
          kategori: kategori.trim(),
          kode_inventaris: finalKode,
          jumlah: Number(jumlah) || 1,
          kondisi,
          lokasi_simpan: lokasi.trim(),
          divisi,
          status: "tersedia",
          penanggung_jawab: uploaderId,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert inventaris error:", error);
        // Fallback simpan lokal jika RLS atau koneksi terkendala
        const fallbackItem: InventarisItem = {
          id: `inv-${Date.now()}`,
          nama_barang: namaBarang.trim(),
          kategori: kategori.trim(),
          kode_inventaris: finalKode,
          jumlah: Number(jumlah) || 1,
          kondisi,
          lokasi_simpan: lokasi.trim(),
          divisi,
          status: "tersedia",
          created_at: new Date().toISOString(),
        };
        setInventarisList((prev) => [fallbackItem, ...prev]);
      } else if (data) {
        setInventarisList((prev) => [data as InventarisItem, ...prev]);
      }

      await refreshData();
      logAction(
        "CREATE_INVENTARIS",
        "inventaris",
        data?.id || finalKode,
        `Registrasi aset baru: ${namaBarang} (${finalKode})`
      );

      setNamaBarang("");
      setIsNewModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat registrasi aset.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLoanModal = (item: InventarisItem) => {
    setSelectedForLoan(item);
    setLoanCatatan("");
  };

  const handleOpenReturnModal = (item: InventarisItem) => {
    setSelectedForReturn(item);
  };

  const handleConfirmLoan = async () => {
    if (!selectedForLoan) return;

    const borrower = anggotaList.find((u) => u.id === selectedBorrower);
    const borrowerName = borrower
      ? `${borrower.nama_lengkap} (${borrower.jabatan || borrower.kelas || "Anggota"})`
      : "Anggota Studio";

    const todayStr = new Date().toISOString().split("T")[0];

    try {
      setIsSubmitting(true);

      // 1. Update inventaris status
      const { error: invErr } = await supabase
        .from("inventaris")
        .update({
          status: "dipinjam",
          keterangan: `Dipinjam oleh ${borrowerName}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedForLoan.id);

      if (invErr) {
        console.warn("Supabase loan inventaris error, fallback reactive:", invErr);
      }

      // Update local state reactive
      setInventarisList((prev) =>
        prev.map((i) =>
          i.id === selectedForLoan.id
            ? {
                ...i,
                status: "dipinjam",
                peminjam_nama: borrowerName,
                keterangan: `Dipinjam oleh ${borrowerName}`,
              }
            : i
        )
      );

      // 2. Insert into inventaris_peminjaman
      const isItemUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        selectedForLoan.id
      );
      const isBorrowerUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        selectedBorrower
      );

      let newLoanRecord: InventarisPeminjaman = {
        id: `loan-${Date.now()}`,
        inventaris_id: selectedForLoan.id,
        anggota_id: selectedBorrower,
        jumlah_pinjam: 1,
        tgl_pinjam: todayStr,
        tgl_kembali: null,
        kondisi_kembali: null,
        catatan: loanCatatan.trim() || undefined,
        peminjam_nama: borrower?.nama_lengkap || borrowerName,
        peminjam_jabatan: borrower?.jabatan,
        peminjam_kelas: borrower?.kelas,
        barang_nama: selectedForLoan.nama_barang,
        kode_inventaris: selectedForLoan.kode_inventaris,
        dicatat_nama: currentUser.nama,
        created_at: new Date().toISOString(),
      };

      if (isItemUuid && isBorrowerUuid) {
        const { data: insertedLoan, error: loanErr } = await supabase
          .from("inventaris_peminjaman")
          .insert({
            inventaris_id: selectedForLoan.id,
            anggota_id: selectedBorrower,
            jumlah_pinjam: 1,
            tgl_pinjam: todayStr,
            dicatat_oleh: currentUser.id && currentUser.id.length === 36 ? currentUser.id : null,
          })
          .select()
          .single();

        if (!loanErr && insertedLoan) {
          newLoanRecord = {
            ...newLoanRecord,
            id: insertedLoan.id,
          };
        }
      }

      setInventarisPeminjamanList((prev) => [newLoanRecord, ...prev]);

      await refreshData();
      logAction(
        "BORROW_INVENTARIS",
        "inventaris",
        selectedForLoan.id,
        `Peminjaman aset ${selectedForLoan.nama_barang} (${selectedForLoan.kode_inventaris}) oleh ${borrowerName}`
      );

      setSelectedForLoan(null);
      setLoanCatatan("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses peminjaman.";
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReturn = async (
    item: InventarisItem,
    returnKondisi: "baik" | "rusak ringan" | "rusak berat" | "hilang",
    catatan?: string
  ) => {
    const todayStr = new Date().toISOString().split("T")[0];

    try {
      // 1. Update inventaris
      const { error: invErr } = await supabase
        .from("inventaris")
        .update({
          status: "tersedia",
          kondisi: returnKondisi,
          keterangan: catatan || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (invErr) {
        console.warn("Supabase return inventaris notice:", invErr);
      }

      setInventarisList((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: "tersedia",
                kondisi: returnKondisi,
                peminjam_nama: undefined,
                keterangan: catatan || undefined,
              }
            : i
        )
      );

      // 2. Update inventaris_peminjaman
      const isItemUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        item.id
      );

      if (isItemUuid) {
        await supabase
          .from("inventaris_peminjaman")
          .update({
            tgl_kembali: todayStr,
            kondisi_kembali: returnKondisi,
          })
          .eq("inventaris_id", item.id)
          .is("tgl_kembali", null);
      }

      // Update local loan history
      setInventarisPeminjamanList((prev) =>
        prev.map((loan) =>
          (loan.inventaris_id === item.id || loan.kode_inventaris === item.kode_inventaris) &&
          !loan.tgl_kembali
            ? {
                ...loan,
                tgl_kembali: todayStr,
                kondisi_kembali: returnKondisi,
                catatan: catatan || loan.catatan,
              }
            : loan
        )
      );

      await refreshData();
      logAction(
        "RETURN_INVENTARIS",
        "inventaris",
        item.id,
        `Pengembalian aset ${item.nama_barang} (${item.kode_inventaris}) - Kondisi: ${returnKondisi}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses pengembalian.";
      alert(msg);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Archive className="w-5 h-5 text-spectrum-cyan" />
            Inventaris Aset Studio & Sirkulasi
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Penomoran otomatis terstandarisasi BRC, pelacakan kondisi perangkat studio, dan log riwayat peminjaman.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
      </div>

      {/* View Switcher Tabs: Katalog vs Riwayat Peminjaman */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-surface-1 border border-studio-border-subtle w-fit text-xs font-semibold">
        <button
          onClick={() => setActiveViewTab("katalog")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeViewTab === "katalog"
              ? "bg-spectrum-cobalt text-ink font-bold shadow-cyan"
              : "text-studio-text-secondary hover:text-white"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Katalog Aset Studio</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeViewTab === "katalog" ? "bg-ink/20 text-ink" : "bg-surface-2 text-studio-text-muted"
            }`}
          >
            {inventarisList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveViewTab("riwayat")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            activeViewTab === "riwayat"
              ? "bg-spectrum-cobalt text-ink font-bold shadow-cyan"
              : "text-studio-text-secondary hover:text-white"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Peminjaman & Sirkulasi</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
              activeViewTab === "riwayat" ? "bg-ink/20 text-ink" : "bg-surface-2 text-studio-text-muted"
            }`}
          >
            {inventarisPeminjamanList.length}
          </span>
        </button>
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
            placeholder={
              activeViewTab === "katalog"
                ? "Cari nama kamera, mic, atau kode BRC..."
                : "Cari nama peminjam, barang, atau catatan..."
            }
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
          />
        </div>

        {activeViewTab === "katalog" && (
          <div className="flex flex-wrap items-center gap-3">
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

            <div className="flex items-center gap-2">
              <label htmlFor="inv-filter-kondisi" className="text-xs font-mono text-studio-text-muted">
                Kondisi:
              </label>
              <select
                id="inv-filter-kondisi"
                value={selectedKondisiFilter}
                onChange={(e) => setSelectedKondisiFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
              >
                <option value="all">Semua Kondisi</option>
                <option value="baik">Kondisi Baik</option>
                <option value="rusak ringan">Rusak Ringan</option>
                <option value="rusak berat">Rusak Berat</option>
                <option value="hilang">Hilang</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* VIEW TAB 1: KATALOG ASET STUDIO */}
      {activeViewTab === "katalog" && (
        <>
          {filteredItems.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-surface-1 border border-dashed border-studio-border-subtle space-y-2">
              <Archive className="w-10 h-10 text-studio-text-muted mx-auto opacity-40" />
              <p className="text-sm font-semibold text-white">Tidak Ada Aset yang Sesuai</p>
              <p className="text-xs text-studio-text-secondary font-mono max-w-sm mx-auto">
                Coba sesuaikan kata kunci pencarian atau ganti filter divisi & kondisi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => {
                const isBorrowed = item.status === "dipinjam";
                const itemLoanHistory = inventarisPeminjamanList.filter(
                  (l) => l.inventaris_id === item.id || l.kode_inventaris === item.kode_inventaris
                );

                return (
                  <div
                    key={item.id}
                    className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-spectrum-cyan bg-surface-2 px-2.5 py-1 rounded-md border border-studio-border-subtle flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5" />
                          {item.kode_inventaris}
                        </span>
                        <StatusBadge
                          label={isBorrowed ? "SEDANG DIPINJAM" : "TERSEDIA"}
                          variant={isBorrowed ? "mandarin" : "jade"}
                        />
                      </div>

                      <h3
                        onClick={() => setSelectedDetailItem(item)}
                        className="text-sm font-bold text-white leading-snug cursor-pointer group-hover:text-spectrum-cyan transition-colors"
                      >
                        {item.nama_barang}
                      </h3>

                      <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle space-y-1.5 text-xs">
                        <div className="flex justify-between text-studio-text-secondary">
                          <span>Kategori:</span>
                          <strong className="text-white">{item.kategori}</strong>
                        </div>
                        <div className="flex justify-between text-studio-text-secondary items-center">
                          <span>Kondisi Fisik:</span>
                          <span
                            className={`font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded-full border ${getKondisiBadgeColor(
                              item.kondisi
                            )}`}
                          >
                            {item.kondisi}
                          </span>
                        </div>
                        <div className="flex justify-between text-studio-text-secondary">
                          <span>Lokasi Simpan:</span>
                          <span className="text-white truncate max-w-[150px]">
                            {item.lokasi_simpan || "Studio Broadcast"}
                          </span>
                        </div>
                        <div className="flex justify-between text-studio-text-secondary">
                          <span>Divisi Pemegang:</span>
                          <span className="text-orbital-magenta font-semibold">{item.divisi}</span>
                        </div>
                        {item.peminjam_nama && (
                          <div className="pt-1.5 border-t border-studio-border-subtle text-[11px] text-spectrum-mandarin font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="truncate">Peminjam: {item.peminjam_nama}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="pt-3 border-t border-studio-border-subtle flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDetailItem(item)}
                        className="flex items-center gap-1.5 text-xs font-mono text-studio-text-secondary hover:text-white transition-colors"
                      >
                        <Info className="w-3.5 h-3.5 text-spectrum-cyan" />
                        <span>Detail & Riwayat ({itemLoanHistory.length})</span>
                      </button>

                      {isBroadcastingOrSekretarisOrAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (isBorrowed) {
                              handleOpenReturnModal(item);
                            } else {
                              handleOpenLoanModal(item);
                            }
                          }}
                          aria-label={isBorrowed ? "Proses kembalikan barang" : "Pinjamkan barang"}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] ${
                            isBorrowed
                              ? "bg-spectrum-jade hover:bg-emerald-400 text-ink shadow-jade"
                              : "bg-surface-2 hover:bg-surface-3 text-studio-text-secondary hover:text-white border border-studio-border-subtle"
                          }`}
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          <span>{isBorrowed ? "Proses Kembali" : "Sirkulasi Pinjam"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW TAB 2: RIWAYAT SIRKULASI & PEMINJAMAN LENGKAP */}
      {activeViewTab === "riwayat" && (
        <div className="bg-surface-1 rounded-2xl border border-studio-border-subtle overflow-hidden">
          <div className="p-4 border-b border-studio-border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-spectrum-gold" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                Log Riwayat Peminjaman & Sirkulasi Seluruh Studio
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-studio-text-secondary border border-studio-border-subtle">
              {filteredLoans.length} Catatan Sirkulasi
            </span>
          </div>

          {filteredLoans.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <History className="w-8 h-8 text-studio-text-muted mx-auto opacity-40" />
              <p className="text-xs font-semibold text-white">Belum Ada Riwayat Peminjaman</p>
              <p className="text-[11px] text-studio-text-secondary font-mono max-w-sm mx-auto">
                Semua peminjaman yang dicatat oleh pengurus studio akan terarsip secara kronologis di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-2/60 text-studio-text-muted font-mono uppercase text-[10px] border-b border-studio-border-subtle">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Kode Aset</th>
                    <th className="py-3 px-4">Nama Perangkat</th>
                    <th className="py-3 px-4">Peminjam</th>
                    <th className="py-3 px-4">Tgl Pinjam</th>
                    <th className="py-3 px-4">Tgl Kembali</th>
                    <th className="py-3 px-4">Kondisi Kembali</th>
                    <th className="py-3 px-4">Status Sirkulasi</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-studio-border-subtle font-mono">
                  {filteredLoans.map((loan, idx) => {
                    const asset = inventarisList.find((i) => i.id === loan.inventaris_id);
                    const borrower = anggotaList.find((a) => a.id === loan.anggota_id);
                    const borrowerName =
                      loan.peminjam_nama || borrower?.nama_lengkap || "Anggota Studio";
                    const borrowerRole =
                      loan.peminjam_jabatan || borrower?.jabatan || (borrower?.kelas ? `Kelas ${borrower.kelas}` : "-");
                    const isCurrentlyActive = !loan.tgl_kembali;

                    return (
                      <tr key={loan.id || idx} className="hover:bg-surface-2/40 transition-colors">
                        <td className="py-3 px-4 text-studio-text-muted">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-spectrum-cyan">
                          {asset?.kode_inventaris || loan.kode_inventaris || "-"}
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-white">
                          {asset?.nama_barang || loan.barang_nama || "Perangkat Studio"}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-sans font-bold text-white">{borrowerName}</p>
                          <p className="text-[10px] text-studio-text-muted">{borrowerRole}</p>
                        </td>
                        <td className="py-3 px-4 text-studio-text-secondary">{loan.tgl_pinjam}</td>
                        <td className="py-3 px-4">
                          {loan.tgl_kembali ? (
                            <span className="text-white font-bold">{loan.tgl_kembali}</span>
                          ) : (
                            <span className="text-spectrum-mandarin font-bold animate-pulse">
                              Sedang Dipinjam
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {loan.kondisi_kembali ? (
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getKondisiBadgeColor(
                                loan.kondisi_kembali
                              )}`}
                            >
                              {loan.kondisi_kembali}
                            </span>
                          ) : (
                            <span className="text-studio-text-muted text-[11px]">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              isCurrentlyActive
                                ? "text-spectrum-mandarin bg-spectrum-mandarin/10 border-spectrum-mandarin/30"
                                : "text-spectrum-jade bg-spectrum-jade/10 border-spectrum-jade/30"
                            }`}
                          >
                            {isCurrentlyActive ? "AKTIF" : "SELESAI"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {asset && (
                            <button
                              type="button"
                              onClick={() => setSelectedDetailItem(asset)}
                              className="px-2.5 py-1 rounded bg-surface-2 hover:bg-surface-3 text-studio-text-secondary hover:text-white transition-colors text-[11px]"
                            >
                              Detail
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
                <div>
                  <h3 id="inv-modal-title" className="text-base font-bold text-white">
                    Registrasi Aset Studio Baru
                  </h3>
                  <p className="text-[11px] font-mono text-studio-text-muted mt-0.5">
                    Penomoran tagging terstandarisasi otomatis oleh sistem
                  </p>
                </div>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  disabled={isSubmitting}
                  aria-label="Tutup modal"
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                {/* Nama Barang */}
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
                    placeholder="Contoh: Sony Alpha 7 IV / Tripod Benro BV-4"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>

                {/* Kode Tagging BRC * (OTOMATIS & TERKUNCI) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="inv-kode" className="block text-xs font-semibold text-white">
                      Kode Tagging BRC *
                    </label>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-spectrum-cyan/10 text-spectrum-cyan border border-spectrum-cyan/30 flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" />
                      Otomatis Terkunci
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      id="inv-kode"
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={kodeInventaris}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-3/70 border border-studio-border-subtle text-xs font-mono font-bold text-spectrum-cyan cursor-not-allowed select-none min-h-[44px] focus:outline-none"
                    />
                    <Lock className="w-3.5 h-3.5 text-spectrum-cyan absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-studio-text-muted font-mono mt-1">
                    * Kode penomoran di-generate otomatis berbasis divisi & urutan aset studio.
                  </p>
                </div>

                {/* Divisi & Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="inv-div" className="block text-xs font-semibold text-white mb-1">
                      Divisi Pemegang *
                    </label>
                    <select
                      id="inv-div"
                      value={divisi}
                      onChange={(e) => setDivisi(e.target.value as DivisiName)}
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
                    <label htmlFor="inv-kat" className="block text-xs font-semibold text-white mb-1">
                      Kategori *
                    </label>
                    <input
                      id="inv-kat"
                      type="text"
                      required
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      placeholder="Kamera, Audio, Lighting, Switcher"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Lokasi & Jumlah */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="inv-lokasi" className="block text-xs font-semibold text-white mb-1">
                      Lokasi Simpan
                    </label>
                    <input
                      id="inv-lokasi"
                      type="text"
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      placeholder="Dry Cabinet Studio A"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="inv-jumlah" className="block text-xs font-semibold text-white mb-1">
                      Jumlah Unit
                    </label>
                    <input
                      id="inv-jumlah"
                      type="number"
                      min={1}
                      value={jumlah}
                      onChange={(e) => setJumlah(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg transition-colors min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !namaBarang.trim()}
                    className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-ink bg-spectrum-cobalt hover:bg-sky-400 rounded-lg transition-all shadow-cyan min-h-[44px] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Simpan Aset Baru</span>
                      </>
                    )}
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
              <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
                <div className="flex items-center gap-2 text-spectrum-mandarin">
                  <ArrowRightLeft className="w-4 h-4" />
                  <h3 id="loan-modal-title" className="text-base font-bold text-white">
                    Peminjaman Aset Studio
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedForLoan(null)}
                  disabled={isSubmitting}
                  aria-label="Tutup modal"
                  className="p-1 rounded-lg text-studio-text-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-surface-1 rounded-xl border border-studio-border-subtle text-xs space-y-1 mt-3 font-mono">
                <span className="text-spectrum-cyan font-bold">{selectedForLoan.kode_inventaris}</span>
                <p className="font-bold text-white font-sans text-sm">{selectedForLoan.nama_barang}</p>
              </div>

              <div className="mt-4 space-y-3">
                <div>
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
                        {u.nama_lengkap} ({u.jabatan || u.kelas || "Anggota"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="loan-catatan" className="block text-xs font-semibold text-white mb-1">
                    Keperluan / Catatan Peminjaman (Opsional)
                  </label>
                  <input
                    id="loan-catatan"
                    type="text"
                    value={loanCatatan}
                    onChange={(e) => setLoanCatatan(e.target.value)}
                    placeholder="Contoh: Liputan Dies Natalis / Podcast Spensa"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-studio-border-subtle mt-4">
                <button
                  type="button"
                  onClick={() => setSelectedForLoan(null)}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLoan}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-ink bg-spectrum-mandarin hover:bg-orange-400 rounded-lg transition-all min-h-[44px] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Konfirmasi Pinjam</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Detail Aset & Riwayat Peminjaman */}
      <DetailInventarisModal
        isOpen={!!selectedDetailItem}
        item={selectedDetailItem}
        peminjamanList={inventarisPeminjamanList}
        anggotaList={anggotaList}
        allUsers={allUsers}
        onClose={() => setSelectedDetailItem(null)}
        onStartLoan={(item) => handleOpenLoanModal(item)}
        onReturnLoan={(item) => handleOpenReturnModal(item)}
        canManage={isBroadcastingOrSekretarisOrAdmin}
      />

      {/* Modal Pengembalian Aset Terinspeksi */}
      <ReturnInventarisModal
        isOpen={!!selectedForReturn}
        item={selectedForReturn}
        onClose={() => setSelectedForReturn(null)}
        onConfirmReturn={handleConfirmReturn}
      />
    </div>
  );
}
