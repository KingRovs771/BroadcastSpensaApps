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
  DollarSign,
  X,
  Edit2,
  Trash2,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function KeuanganPembinaPage() {
  const { currentUser, keuanganPembinaList, refreshData, logAction, supabase } =
    useSession();

  // Create modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createTanggal, setCreateTanggal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [createSumberDana, setCreateSumberDana] = useState<
    "BOS" | "Dana Sekolah" | "Sponsor"
  >("BOS");
  const [createTipeTransaksi, setCreateTipeTransaksi] = useState<
    "masuk" | "keluar"
  >("masuk");
  const [createNominal, setCreateNominal] = useState(0);
  const [createKeterangan, setCreateKeterangan] = useState("");
  const [createCatatan, setCreateCatatan] = useState("");
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  // Edit modal states
  const [editingItem, setEditingItem] = useState<KeuanganPembinaItem | null>(
    null
  );
  const [editTanggal, setEditTanggal] = useState("");
  const [editSumberDana, setEditSumberDana] = useState<
    "BOS" | "Dana Sekolah" | "Sponsor"
  >("BOS");
  const [editTipeTransaksi, setEditTipeTransaksi] = useState<
    "masuk" | "keluar"
  >("masuk");
  const [editNominal, setEditNominal] = useState(0);
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editCatatan, setEditCatatan] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete dialog states
  const [deletingItem, setDeletingItem] = useState<KeuanganPembinaItem | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSumberDana, setFilterSumberDana] = useState<string>("all");
  const [filterTipe, setFilterTipe] = useState<string>("all");

  const userRole = (currentUser.role || "").toLowerCase();
  const isPrivileged = [
    "pembina",
    "ketua_broadcast",
    "bendahara",
    "administrator",
    "admin",
  ].includes(userRole);

  const isPembinaOrAdmin =
    userRole === "pembina" ||
    userRole === "administrator" ||
    userRole === "admin";

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
          Buku Catatan Keuangan Pembina merupakan buku besar terisolasi (*air-gapped ledger*) khusus dana operasional sekolah (BOS/Sponsor). Modul ini hanya dapat diakses oleh Pembina, Ketua Broadcast, Bendahara, dan Administrator.
        </p>
        <span className="text-[10px] font-mono text-studio-text-muted">
          Akun aktif: {currentUser.nama} ({currentUser.role})
        </span>
      </div>
    );
  }

  // Filter transactions
  const filteredList = keuanganPembinaList.filter((item) => {
    const matchesSearch =
      item.keterangan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.catatan_pembina || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tanggal.includes(searchQuery);

    const matchesSumber =
      filterSumberDana === "all" ? true : item.sumber_dana === filterSumberDana;

    const matchesTipe =
      filterTipe === "all"
        ? true
        : filterTipe === "masuk"
        ? item.pemasukan > 0
        : item.pengeluaran > 0;

    return matchesSearch && matchesSumber && matchesTipe;
  });

  // Calculate totals from entire ledger
  const totalPemasukan = keuanganPembinaList.reduce(
    (sum, item) => sum + item.pemasukan,
    0
  );
  const totalPengeluaran = keuanganPembinaList.reduce(
    (sum, item) => sum + item.pengeluaran,
    0
  );
  const saldoBersih = totalPemasukan - totalPengeluaran;

  // ── CREATE HANDLER ───────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createNominal <= 0) {
      alert("Nominal transaksi harus lebih dari Rp 0");
      return;
    }

    setIsSubmittingCreate(true);

    try {
      const { data, error } = await supabase
        .from("keuangan_pembina")
        .insert({
          tanggal: createTanggal || new Date().toISOString().split("T")[0],
          sumber_dana: createSumberDana,
          keterangan: createKeterangan.trim(),
          pemasukan: createTipeTransaksi === "masuk" ? Number(createNominal) : 0,
          pengeluaran: createTipeTransaksi === "keluar" ? Number(createNominal) : 0,
          catatan_pembina: createCatatan.trim() || null,
          created_by: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert keuangan_pembina error:", error);
        alert(`Gagal mencatat transaksi: ${error.message}`);
        setIsSubmittingCreate(false);
        return;
      }

      await refreshData();
      logAction(
        "CREATE_KEUANGAN_PEMBINA",
        "keuangan_pembina",
        data?.id || "new",
        `${currentUser.nama} mencatat ${
          createTipeTransaksi === "masuk" ? "pemasukan" : "pengeluaran"
        } ${formatIDR(createNominal)}: ${createKeterangan}`
      );

      setCreateNominal(0);
      setCreateKeterangan("");
      setCreateCatatan("");
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // ── EDIT HANDLERS ────────────────────────────────────────────────────────────
  const handleOpenEdit = (item: KeuanganPembinaItem) => {
    setEditingItem(item);
    setEditTanggal(item.tanggal);
    setEditSumberDana(item.sumber_dana);
    setEditTipeTransaksi(item.pemasukan > 0 ? "masuk" : "keluar");
    setEditNominal(item.pemasukan > 0 ? item.pemasukan : item.pengeluaran);
    setEditKeterangan(item.keterangan);
    setEditCatatan(item.catatan_pembina || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (editNominal <= 0) {
      alert("Nominal transaksi harus lebih dari Rp 0");
      return;
    }

    setIsSubmittingEdit(true);

    try {
      const { error } = await supabase
        .from("keuangan_pembina")
        .update({
          tanggal: editTanggal,
          sumber_dana: editSumberDana,
          keterangan: editKeterangan.trim(),
          pemasukan: editTipeTransaksi === "masuk" ? Number(editNominal) : 0,
          pengeluaran: editTipeTransaksi === "keluar" ? Number(editNominal) : 0,
          catatan_pembina: editCatatan.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItem.id);

      if (error) {
        console.error("Supabase update keuangan_pembina error:", error);
        alert(`Gagal memperbarui transaksi: ${error.message}`);
        setIsSubmittingEdit(false);
        return;
      }

      await refreshData();
      logAction(
        "UPDATE_KEUANGAN_PEMBINA",
        "keuangan_pembina",
        editingItem.id,
        `${currentUser.nama} memperbarui transaksi ${editingItem.id} (${editKeterangan})`
      );

      setEditingItem(null);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // ── DELETE HANDLER ───────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!deletingItem) return;

    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from("keuangan_pembina")
        .delete()
        .eq("id", deletingItem.id);

      if (error) {
        console.error("Supabase delete keuangan_pembina error:", error);
        alert(`Gagal menghapus transaksi: ${error.message}`);
        setIsDeleting(false);
        return;
      }

      await refreshData();
      logAction(
        "DELETE_KEUANGAN_PEMBINA",
        "keuangan_pembina",
        deletingItem.id,
        `${currentUser.nama} menghapus transaksi: ${deletingItem.keterangan} (${formatIDR(
          deletingItem.pemasukan || deletingItem.pengeluaran
        )})`
      );

      setDeletingItem(null);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── EXPORT CSV ───────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    const headers = [
      "Tanggal",
      "Sumber Dana",
      "Keterangan",
      "Pemasukan (IDR)",
      "Pengeluaran (IDR)",
      "Catatan",
    ];
    const rows = filteredList.map((item) => [
      item.tanggal,
      item.sumber_dana,
      `"${item.keterangan.replace(/"/g, '""')}"`,
      item.pemasukan.toString(),
      item.pengeluaran.toString(),
      `"${(item.catatan_pembina || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Keuangan_Pembina_Spensa_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              AIR-GAPPED LEDGER
            </span>
          </div>
          <p className="text-xs text-studio-text-secondary mt-1">
            Buku besar terisolasi khusus dana operasional sekolah (BOS, Subsidi Komite, Sponsor) dengan fitur CRUD lengkap bagi Pembina dan Administrator.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            aria-label="Export ke CSV"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-white text-xs font-semibold transition-colors min-h-[44px]"
          >
            <Download className="w-4 h-4 text-spectrum-cobalt" />
            <span>Ekspor CSV</span>
          </button>

          {isPembinaOrAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              aria-label="Catat Transaksi Kas Pembina"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orbital-violet hover:bg-orbital-magenta text-ink text-xs font-bold transition-all shadow-orbital min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Transaksi Baru</span>
            </button>
          )}
        </div>
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
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Dana masuk dari BOS / Sponsor
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
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Belanja operasional studio
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orbital-violet/10 rounded-full blur-2xl" />
          <p className="text-[10px] font-mono font-bold text-orbital-magenta uppercase flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5" /> Saldo Dana Pembina
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">
            {formatIDR(saldoBersih)}
          </p>
          <p className="text-[11px] font-mono text-studio-text-muted mt-1">
            Selisih kas aktif di tangan Pembina
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-surface-1 p-3 rounded-xl border border-studio-border-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan keterangan atau catatan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-surface-2 border border-studio-border-subtle rounded-lg text-xs text-white placeholder:text-studio-text-muted focus:outline-none focus:border-orbital-violet"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1.5 rounded-lg border border-studio-border-subtle">
            <Filter className="w-3.5 h-3.5 text-studio-text-muted" />
            <select
              aria-label="Filter Sumber Dana"
              value={filterSumberDana}
              onChange={(e) => setFilterSumberDana(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface-2 text-white">
                Semua Sumber Dana
              </option>
              <option value="BOS" className="bg-surface-2 text-white">
                BOS
              </option>
              <option value="Dana Sekolah" className="bg-surface-2 text-white">
                Dana Sekolah
              </option>
              <option value="Sponsor" className="bg-surface-2 text-white">
                Sponsor
              </option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-surface-2 px-3 py-1.5 rounded-lg border border-studio-border-subtle">
            <select
              aria-label="Filter Tipe Transaksi"
              value={filterTipe}
              onChange={(e) => setFilterTipe(e.target.value)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-surface-2 text-white">
                Semua Tipe
              </option>
              <option value="masuk" className="bg-surface-2 text-white">
                Pemasukan
              </option>
              <option value="keluar" className="bg-surface-2 text-white">
                Pengeluaran
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-4 lg:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
          <h3 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
            Mutasi Kas Masuk & Keluar Pembina
          </h3>
          <span className="text-[11px] font-mono text-studio-text-muted">
            {filteredList.length} dari {keuanganPembinaList.length} Transaksi Ditampilkan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-studio-border-subtle text-[11px] font-mono uppercase text-studio-text-secondary">
                <th className="py-3 px-3">Tanggal</th>
                <th className="py-3 px-2">Sumber Dana</th>
                <th className="py-3 px-3">Keterangan Transaksi</th>
                <th className="py-3 px-3 text-right">Pemasukan</th>
                <th className="py-3 px-3 text-right">Pengeluaran</th>
                {isPembinaOrAdmin && (
                  <th className="py-3 px-3 text-center">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border-subtle text-xs">
              {filteredList.length === 0 ? (
                <tr>
                  <td
                    colSpan={isPembinaOrAdmin ? 6 : 5}
                    className="py-10 text-center text-studio-text-muted font-mono"
                  >
                    Tidak ada transaksi keuangan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-surface-2/60 transition-colors group"
                  >
                    <td className="py-3 px-3 font-mono text-studio-text-muted whitespace-nowrap">
                      {item.tanggal}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          item.sumber_dana === "BOS"
                            ? "bg-spectrum-cobalt/20 text-spectrum-cobalt border-spectrum-cobalt/30"
                            : item.sumber_dana === "Sponsor"
                            ? "bg-orbital-violet/20 text-orbital-magenta border-orbital-violet/30"
                            : "bg-surface-2 text-white border-studio-border-subtle"
                        }`}
                      >
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
                      {item.pemasukan > 0
                        ? `+${formatIDR(item.pemasukan)}`
                        : "-"}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-spectrum-tangerine">
                      {item.pengeluaran > 0
                        ? `-${formatIDR(item.pengeluaran)}`
                        : "-"}
                    </td>
                    {isPembinaOrAdmin && (
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            title="Edit Transaksi"
                            aria-label={`Edit transaksi ${item.keterangan}`}
                            className="p-1.5 rounded-lg bg-surface-3 hover:bg-orbital-violet hover:text-ink text-studio-text-secondary transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingItem(item)}
                            title="Hapus Transaksi"
                            aria-label={`Hapus transaksi ${item.keterangan}`}
                            className="p-1.5 rounded-lg bg-surface-3 hover:bg-spectrum-tangerine hover:text-ink text-studio-text-secondary transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: CATAT TRANSAKSI BARU (CREATE) ─────────────────────────── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="keuangan-create-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsCreateModalOpen(false)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
                <h3
                  id="keuangan-create-title"
                  className="text-base font-bold text-white flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 text-orbital-magenta" />
                  Catat Mutasi Kas Pembina
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
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
                    onClick={() => setCreateTipeTransaksi("masuk")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      createTipeTransaksi === "masuk"
                        ? "bg-spectrum-jade/20 border-spectrum-jade text-spectrum-jade"
                        : "border-studio-border-subtle text-studio-text-secondary hover:text-white"
                    }`}
                  >
                    + Pemasukan Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateTipeTransaksi("keluar")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      createTipeTransaksi === "keluar"
                        ? "bg-spectrum-tangerine/20 border-spectrum-tangerine text-spectrum-tangerine"
                        : "border-studio-border-subtle text-studio-text-secondary hover:text-white"
                    }`}
                  >
                    - Pengeluaran / Belanja
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="kp-tgl"
                      className="block text-xs font-semibold text-white mb-1"
                    >
                      Tanggal Transaksi *
                    </label>
                    <input
                      id="kp-tgl"
                      type="date"
                      required
                      value={createTanggal}
                      onChange={(e) => setCreateTanggal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="kp-sumber"
                      className="block text-xs font-semibold text-white mb-1"
                    >
                      Sumber Dana *
                    </label>
                    <select
                      id="kp-sumber"
                      value={createSumberDana}
                      onChange={(e) => setCreateSumberDana(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none min-h-[44px]"
                    >
                      <option value="BOS">BOS (Bantuan Operasional)</option>
                      <option value="Dana Sekolah">Dana Sekolah / Komite</option>
                      <option value="Sponsor">Sponsor Eksternal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="kp-nominal"
                    className="block text-xs font-semibold text-white mb-1"
                  >
                    Nominal Transaksi (Rp) *
                  </label>
                  <input
                    id="kp-nominal"
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={createNominal || ""}
                    onChange={(e) => setCreateNominal(Number(e.target.value))}
                    placeholder="Contoh: 1500000"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-sm font-mono text-white focus:border-orbital-violet focus:outline-none min-h-[44px]"
                  />
                  {createNominal > 0 && (
                    <p className="text-[11px] font-mono text-studio-text-secondary mt-1">
                      Terbilang: {formatIDR(createNominal)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="kp-keterangan"
                    className="block text-xs font-semibold text-white mb-1"
                  >
                    Keterangan Transaksi *
                  </label>
                  <input
                    id="kp-keterangan"
                    type="text"
                    required
                    value={createKeterangan}
                    onChange={(e) => setCreateKeterangan(e.target.value)}
                    placeholder="Contoh: Pengadaan 2 unit SSD Master Video"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="kp-catatan"
                    className="block text-xs font-semibold text-white mb-1"
                  >
                    Catatan Pembina (Opsional)
                  </label>
                  <textarea
                    id="kp-catatan"
                    rows={2}
                    value={createCatatan}
                    onChange={(e) => setCreateCatatan(e.target.value)}
                    placeholder="Catatan verifikasi nota atau persetujuan kepala sekolah..."
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCreate}
                    className="px-5 py-2 text-xs font-bold text-ink bg-orbital-violet hover:bg-orbital-magenta rounded-lg transition-all shadow-orbital min-h-[44px] disabled:opacity-50"
                  >
                    {isSubmittingCreate ? "Menyimpan..." : "Simpan ke Ledger"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: EDIT TRANSAKSI (UPDATE) ──────────────────────────────── */}
      <AnimatePresence>
        {editingItem && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="keuangan-edit-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setEditingItem(null)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital z-10 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
                <h3
                  id="keuangan-edit-title"
                  className="text-base font-bold text-white flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4 text-spectrum-cyan" />
                  Edit Mutasi Kas Pembina
                </h3>
                <button
                  onClick={() => setEditingItem(null)}
                  aria-label="Tutup modal"
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="mt-4 space-y-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditTipeTransaksi("masuk")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      editTipeTransaksi === "masuk"
                        ? "bg-spectrum-jade/20 border-spectrum-jade text-spectrum-jade"
                        : "border-studio-border-subtle text-studio-text-secondary hover:text-white"
                    }`}
                  >
                    + Pemasukan Kas
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTipeTransaksi("keluar")}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                      editTipeTransaksi === "keluar"
                        ? "bg-spectrum-tangerine/20 border-spectrum-tangerine text-spectrum-tangerine"
                        : "border-studio-border-subtle text-studio-text-secondary hover:text-white"
                    }`}
                  >
                    - Pengeluaran / Belanja
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="edit-tgl"
                      className="block text-xs font-semibold text-white mb-1"
                    >
                      Tanggal Transaksi *
                    </label>
                    <input
                      id="edit-tgl"
                      type="date"
                      required
                      value={editTanggal}
                      onChange={(e) => setEditTanggal(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="edit-sumber"
                      className="block text-xs font-semibold text-white mb-1"
                    >
                      Sumber Dana *
                    </label>
                    <select
                      id="edit-sumber"
                      value={editSumberDana}
                      onChange={(e) => setEditSumberDana(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    >
                      <option value="BOS">BOS (Bantuan Operasional)</option>
                      <option value="Dana Sekolah">Dana Sekolah / Komite</option>
                      <option value="Sponsor">Sponsor Eksternal</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="edit-nominal"
                    className="block text-xs font-semibold text-white mb-1"
                  >
                    Nominal Transaksi (Rp) *
                  </label>
                  <input
                    id="edit-nominal"
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={editNominal || ""}
                    onChange={(e) => setEditNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-sm font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                  {editNominal > 0 && (
                    <p className="text-[11px] font-mono text-studio-text-secondary mt-1">
                      Terbilang: {formatIDR(editNominal)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="edit-keterangan"
                    className="block text-xs font-semibold text-white mb-1"
                  >
                    Keterangan Transaksi *
                  </label>
                  <input
                    id="edit-keterangan"
                    type="text"
                    required
                    value={editKeterangan}
                    onChange={(e) => setEditKeterangan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="edit-catatan"
                    className="block text-xs font-semibold text-white mb-1"
                  >
                    Catatan Pembina (Opsional)
                  </label>
                  <textarea
                    id="edit-catatan"
                    rows={2}
                    value={editCatatan}
                    onChange={(e) => setEditCatatan(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingEdit}
                    className="px-5 py-2 text-xs font-bold text-cosmic bg-spectrum-cyan hover:bg-sky-400 rounded-lg transition-all shadow-cyan min-h-[44px] disabled:opacity-50"
                  >
                    {isSubmittingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: KONFIRMASI HAPUS (DELETE) ────────────────────────────── */}
      <AnimatePresence>
        {deletingItem && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="keuangan-delete-title"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDeletingItem(null)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-spectrum-tangerine/30 rounded-2xl max-w-md w-full p-6 shadow-orbital z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-spectrum-tangerine/15 text-spectrum-tangerine flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    id="keuangan-delete-title"
                    className="text-base font-bold text-white"
                  >
                    Hapus Transaksi Kas?
                  </h3>
                  <p className="text-xs text-studio-text-secondary mt-0.5">
                    Tindakan ini permanen dan akan menghapus catatan mutasi dari buku besar.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs space-y-1.5 font-mono">
                <p className="text-white font-bold">
                  {deletingItem.keterangan}
                </p>
                <div className="flex justify-between text-studio-text-secondary">
                  <span>Tanggal: {deletingItem.tanggal}</span>
                  <span>Sumber: {deletingItem.sumber_dana}</span>
                </div>
                <p className="text-right font-bold text-spectrum-tangerine text-sm pt-1 border-t border-studio-border-subtle">
                  {formatIDR(deletingItem.pemasukan || deletingItem.pengeluaran)}
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-bold text-white bg-spectrum-tangerine hover:bg-orange-600 rounded-lg transition-all min-h-[44px] disabled:opacity-50"
                >
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Transaksi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
