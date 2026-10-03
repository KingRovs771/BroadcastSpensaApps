"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { AgendaFoto } from "@/lib/mock/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { KopSuratSpensa } from "@/components/modules/laporan/KopSuratSpensa";
import {
  Camera,
  Plus,
  Trophy,
  CheckCircle2,
  Clock,
  X,
  Calendar,
  AlertCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  Printer,
  Eye,
  Award,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types & Form Data ────────────────────────────────────────────────────────
interface AgendaFotoFormData {
  kejuaraan: string;
  nama_siswa: string;
  kelas: string;
  tingkat: AgendaFoto["tingkat"];
  tanggal: string;
  status: "belum" | "sudah";
  keterangan: string;
}

const EMPTY_FORM: AgendaFotoFormData = {
  kejuaraan: "",
  nama_siswa: "",
  kelas: "",
  tingkat: "kota",
  tanggal: new Date().toISOString().split("T")[0],
  status: "belum",
  keterangan: "",
};

const TINGKAT_LABELS: Record<AgendaFoto["tingkat"], { label: string; badgeClass: string }> = {
  sekolah: {
    label: "Tingkat Sekolah",
    badgeClass: "bg-surface-2 text-slate-300 border-studio-border-subtle",
  },
  kecamatan: {
    label: "Tingkat Kecamatan",
    badgeClass: "bg-spectrum-cobalt/20 text-sky-300 border-sky-500/30",
  },
  kabupaten: {
    label: "Tingkat Kabupaten",
    badgeClass: "bg-spectrum-cyan/20 text-cyan-300 border-cyan-500/30",
  },
  kota: {
    label: "Tingkat Kota",
    badgeClass: "bg-spectrum-cyan/20 text-cyan-300 border-cyan-500/30",
  },
  provinsi: {
    label: "Tingkat Provinsi",
    badgeClass: "bg-orbital-violet/20 text-orbital-magenta border-orbital-violet/30",
  },
  nasional: {
    label: "Tingkat Nasional",
    badgeClass: "bg-spectrum-gold/20 text-spectrum-gold border-spectrum-gold/30 font-bold",
  },
};

// ── Modal Form Terpisah (Module Scope agar tidak re-mount saat mengetik) ────
function AgendaFotoFormModal({
  title,
  form,
  setForm,
  isSubmitting,
  onSubmit,
  onClose,
}: {
  title: string;
  form: AgendaFotoFormData;
  setForm: React.Dispatch<React.SetStateAction<AgendaFotoFormData>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="foto-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-lg w-full p-6 shadow-orbital z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-spectrum-gold" />
            <h3 id="foto-modal-title" className="text-base font-bold text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {/* Nama Kejuaraan */}
          <div>
            <label htmlFor="af-kejuaraan" className="block text-xs font-semibold text-white mb-1">
              Nama Kejuaraan / Kompetisi *
            </label>
            <input
              id="af-kejuaraan"
              type="text"
              required
              value={form.kejuaraan}
              onChange={(e) => setForm((prev) => ({ ...prev, kejuaraan: e.target.value }))}
              placeholder="Contoh: Juara 1 Lomba Robotika & STEM Nasional 2026"
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Nama Siswa & Kelas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="af-siswa" className="block text-xs font-semibold text-white mb-1">
                Nama Siswa / Pemenang *
              </label>
              <input
                id="af-siswa"
                type="text"
                required
                value={form.nama_siswa}
                onChange={(e) => setForm((prev) => ({ ...prev, nama_siswa: e.target.value }))}
                placeholder="Contoh: Clarissa Putri / Tim Spensa"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor="af-kelas" className="block text-xs font-semibold text-white mb-1">
                Kelas *
              </label>
              <input
                id="af-kelas"
                type="text"
                required
                value={form.kelas}
                onChange={(e) => setForm((prev) => ({ ...prev, kelas: e.target.value }))}
                placeholder="IX-A"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Tingkat & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="af-tingkat" className="block text-xs font-semibold text-white mb-1">
                Tingkat Kompetisi *
              </label>
              <select
                id="af-tingkat"
                value={form.tingkat}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    tingkat: e.target.value as AgendaFoto["tingkat"],
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              >
                <option value="sekolah">Sekolah</option>
                <option value="kecamatan">Kecamatan</option>
                <option value="kabupaten">Kabupaten</option>
                <option value="kota">Kota</option>
                <option value="provinsi">Provinsi</option>
                <option value="nasional">Nasional</option>
              </select>
            </div>
            <div>
              <label htmlFor="af-tanggal" className="block text-xs font-semibold text-white mb-1">
                Tanggal Kegiatan *
              </label>
              <input
                id="af-tanggal"
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Status Dokumentasi */}
          <div>
            <label htmlFor="af-status" className="block text-xs font-semibold text-white mb-1">
              Status Dokumentasi Liputan
            </label>
            <select
              id="af-status"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as "belum" | "sudah",
                }))
              }
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            >
              <option value="belum">Belum Lengkap / Menunggu Liputan</option>
              <option value="sudah">Sudah Lengkap / Dokumentasi Tuntas</option>
            </select>
          </div>

          {/* Keterangan / Link Dokumentasi */}
          <div>
            <label htmlFor="af-keterangan" className="block text-xs font-semibold text-white mb-1">
              Catatan / Detail Dokumentasi Foto
            </label>
            <textarea
              id="af-keterangan"
              rows={3}
              value={form.keterangan}
              onChange={(e) => setForm((prev) => ({ ...prev, keterangan: e.target.value }))}
              placeholder="Catatan liputan, pose panggung, nama fotografer, atau tautan album Google Drive..."
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white font-mono focus:border-spectrum-cyan focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-studio-border-subtle">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-ink bg-spectrum-cobalt hover:bg-sky-400 rounded-lg transition-all shadow-cyan min-h-[44px] disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Detail Modal View ────────────────────────────────────────────────────────
function AgendaFotoDetailModal({
  item,
  onClose,
  onEdit,
}: {
  item: AgendaFoto;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const isDone = item.status === "sudah";
  const tingkatCfg = TINGKAT_LABELS[item.tingkat] || TINGKAT_LABELS.kota;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="foto-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital z-10 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-spectrum-gold" />
            <h3 id="foto-detail-title" className="text-sm font-bold text-white">
              Detail Prestasi &amp; Dokumentasi
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border ${tingkatCfg.badgeClass}`}>
              {tingkatCfg.label}
            </span>
            <h4 className="text-base font-bold text-white mt-1.5 leading-snug">
              {item.kejuaraan}
            </h4>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-studio-text-secondary">Pemenang / Siswa:</span>
              <span className="font-bold text-white">{item.nama_siswa}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-studio-text-secondary">Kelas:</span>
              <span className="font-mono font-semibold text-spectrum-cyan">{item.kelas}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-studio-text-secondary">Tanggal Kegiatan:</span>
              <span className="font-mono text-white">
                {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-studio-border-subtle">
              <span className="text-studio-text-secondary">Status Dokumentasi:</span>
              <StatusBadge
                label={isDone ? "DOKUMENTASI TUNTAS" : "BELUM LENGKAP"}
                variant={isDone ? "jade" : "amber"}
              />
            </div>
          </div>

          {item.keterangan ? (
            <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs">
              <p className="text-[10px] font-mono text-studio-text-muted uppercase mb-1">Catatan Liputan:</p>
              <p className="text-studio-text-secondary whitespace-pre-wrap font-mono text-[11px]">
                {item.keterangan}
              </p>
            </div>
          ) : (
            <p className="text-xs text-studio-text-muted italic text-center py-1">
              Tidak ada catatan tambahan untuk kejuaraan ini.
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-studio-border-subtle">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
          >
            Tutup
          </button>
          {onEdit && (
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-4 py-2 text-xs font-bold text-ink bg-spectrum-cyan hover:bg-cyan-400 rounded-lg transition-all min-h-[44px] flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Data</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function AgendaFotoPage() {
  const {
    currentUser,
    agendaFotoList,
    setAgendaFotoList,
    refreshData,
    logAction,
    supabase,
  } = useSession();

  // ── Modal & Filter States ──────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AgendaFoto | null>(null);
  const [deletingItem, setDeletingItem] = useState<AgendaFoto | null>(null);
  const [detailItem, setDetailItem] = useState<AgendaFoto | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);

  const [form, setForm] = useState<AgendaFotoFormData>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "belum" | "sudah">("all");
  const [filterTingkat, setFilterTingkat] = useState<string>("all");

  // ── Role Permissions ───────────────────────────────────────────────────────
  // Pembina, Ketua Broadcast, Sekretaris, Ketua Divisi Fotografer, Administrator
  const canManage =
    currentUser.role === "pembina" ||
    currentUser.role === "sekretaris" ||
    currentUser.role === "administrator" ||
    currentUser.role === "ketua_broadcast" ||
    (currentUser.role === "ketua_divisi" && currentUser.divisi === "Fotografer");

  const canCurate = canManage;

  // ── Filter Data ───────────────────────────────────────────────────────────
  const filteredList = useMemo(() => {
    return (agendaFotoList || [])
      .filter((item) => {
        if (filterStatus !== "all" && item.status !== filterStatus) return false;
        if (filterTingkat !== "all" && item.tingkat !== filterTingkat) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchKejuaraan = item.kejuaraan.toLowerCase().includes(q);
          const matchSiswa = item.nama_siswa.toLowerCase().includes(q);
          const matchKelas = item.kelas.toLowerCase().includes(q);
          const matchKet = item.keterangan?.toLowerCase().includes(q);
          return matchKejuaraan || matchSiswa || matchKelas || matchKet;
        }
        return true;
      })
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [agendaFotoList, filterStatus, filterTingkat, searchQuery]);

  // Statistics
  const totalCount = agendaFotoList?.length || 0;
  const doneCount = agendaFotoList?.filter((a) => a.status === "sudah").length || 0;
  const pendingCount = totalCount - doneCount;
  const nasionalCount = agendaFotoList?.filter((a) => a.tingkat === "nasional" || a.tingkat === "provinsi").length || 0;

  // ── CRUD Handlers ──────────────────────────────────────────────────────────

  // 1. Create
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const creatorId =
      currentUser.id && currentUser.id.length === 36 ? currentUser.id : null;

    try {
      const { data, error } = await supabase
        .from("agenda_foto")
        .insert({
          nama_siswa: form.nama_siswa,
          kelas: form.kelas,
          kejuaraan: form.kejuaraan,
          tingkat: form.tingkat,
          tanggal: form.tanggal,
          status: form.status,
          keterangan: form.keterangan || null,
          divisi: "Fotografer",
          dibuat_oleh: creatorId,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert agenda_foto error:", error);
        alert(`Gagal menambah data: ${error.message}`);
        return;
      }

      if (data) {
        setAgendaFotoList((prev) => [data as AgendaFoto, ...prev]);
      }

      await refreshData();
      logAction(
        "CREATE_AGENDA_FOTO",
        "agenda_foto",
        data?.id || "new",
        `Daftarkan kejuaraan: ${form.kejuaraan} (${form.nama_siswa}) oleh ${currentUser.nama}`
      );

      setForm(EMPTY_FORM);
      setIsCreateOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Open Edit
  const handleOpenEdit = (item: AgendaFoto) => {
    setEditingItem(item);
    setForm({
      kejuaraan: item.kejuaraan,
      nama_siswa: item.nama_siswa,
      kelas: item.kelas,
      tingkat: item.tingkat,
      tanggal: item.tanggal,
      status: item.status,
      keterangan: item.keterangan || "",
    });
  };

  // 3. Update / Edit
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);

    const updaterId =
      currentUser.id && currentUser.id.length === 36 ? currentUser.id : null;

    try {
      const { error } = await supabase
        .from("agenda_foto")
        .update({
          nama_siswa: form.nama_siswa,
          kelas: form.kelas,
          kejuaraan: form.kejuaraan,
          tingkat: form.tingkat,
          tanggal: form.tanggal,
          status: form.status,
          keterangan: form.keterangan || null,
          diupdate_oleh: updaterId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingItem.id);

      if (error) {
        console.error("Supabase update agenda_foto error:", error);
        alert(`Gagal memperbarui data: ${error.message}`);
        return;
      }

      setAgendaFotoList((prev) =>
        prev.map((a) =>
          a.id === editingItem.id
            ? {
                ...a,
                nama_siswa: form.nama_siswa,
                kelas: form.kelas,
                kejuaraan: form.kejuaraan,
                tingkat: form.tingkat,
                tanggal: form.tanggal,
                status: form.status,
                keterangan: form.keterangan || undefined,
              }
            : a
        )
      );

      await refreshData();
      logAction(
        "UPDATE_AGENDA_FOTO",
        "agenda_foto",
        editingItem.id,
        `${currentUser.nama} memperbarui data kejuaraan: ${form.kejuaraan}`
      );

      setEditingItem(null);
      setForm(EMPTY_FORM);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Delete
  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("agenda_foto")
        .delete()
        .eq("id", deletingItem.id);

      if (error) {
        console.error("Supabase delete agenda_foto error:", error);
        alert(`Gagal menghapus data: ${error.message}`);
        return;
      }

      setAgendaFotoList((prev) => prev.filter((a) => a.id !== deletingItem.id));
      await refreshData();

      logAction(
        "DELETE_AGENDA_FOTO",
        "agenda_foto",
        deletingItem.id,
        `${currentUser.nama} menghapus rekor lomba: ${deletingItem.kejuaraan}`
      );

      setDeletingItem(null);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Quick Toggle Status
  const handleToggleStatus = async (item: AgendaFoto) => {
    if (!canCurate) {
      alert(
        "Hanya Pembina, Ketua Divisi Fotografer, Sekretaris, atau Administrator yang berhak memperbarui status dokumentasi liputan lomba!"
      );
      return;
    }

    const nextStatus = item.status === "sudah" ? "belum" : "sudah";
    const updaterId =
      currentUser.id && currentUser.id.length === 36 ? currentUser.id : null;

    try {
      const { error } = await supabase
        .from("agenda_foto")
        .update({
          status: nextStatus,
          diupdate_oleh: updaterId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        console.error("Supabase update agenda_foto error:", error);
      }

      setAgendaFotoList((prev) =>
        prev.map((a) => (a.id === item.id ? { ...a, status: nextStatus } : a))
      );

      await refreshData();
      logAction(
        "CURATE_AGENDA_FOTO",
        "agenda_foto",
        item.id,
        `${currentUser.nama} (${currentUser.role}) mengubah status dokumentasi ${item.kejuaraan} menjadi ${nextStatus.toUpperCase()}`
      );
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  // ── Print Mode View ────────────────────────────────────────────────────────
  if (isPrintMode) {
    return (
      <div className="space-y-4">
        <div className="print:hidden flex items-center justify-between gap-3 p-4 bg-surface-1 border border-studio-border-subtle rounded-2xl">
          <div className="flex items-center gap-2 text-xs text-studio-text-secondary">
            <Printer className="w-4 h-4 text-spectrum-cyan" />
            <span>Mode Pratinjau Dokumen Cetak Rekapitulasi Kejuaraan &amp; Lomba Siswa</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPrintMode(false)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-xs text-studio-text-secondary hover:text-white border border-studio-border-subtle min-h-[40px]"
            >
              <X className="w-4 h-4" />
              <span>Tutup Pratinjau</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all min-h-[40px]"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        <div className="printable-document bg-white text-slate-900 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto border border-slate-200 font-sans print:p-0 print:border-none print:shadow-none">
          <KopSuratSpensa subJudul="REKAPITULASI AGENDA DOKUMENTASI KEJUARAAN & PRESTASI LOMBA SISWA" />

          <div className="text-center my-3">
            <h2 className="font-serif font-bold text-sm tracking-wider uppercase text-blue-950">
              BUKU REKOR DOKUMENTASI KEJUARAAN BROADCAST CLUB
            </h2>
            <p className="text-[11px] font-mono text-slate-600 mt-1">
              SMP Negeri 1 Sragen · Divisi Fotografer &amp; Dokumentasi
            </p>
          </div>

          <table className="w-full text-[10px] border-collapse border border-slate-300 my-4">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-serif">
                <th className="p-2 border border-slate-300 text-center w-8">No.</th>
                <th className="p-2 border border-slate-300 text-left">Nama Kejuaraan / Kompetisi</th>
                <th className="p-2 border border-slate-300 text-left">Siswa / Pemenang</th>
                <th className="p-2 border border-slate-300 text-center">Kelas</th>
                <th className="p-2 border border-slate-300 text-center">Tingkat</th>
                <th className="p-2 border border-slate-300 text-center">Tanggal</th>
                <th className="p-2 border border-slate-300 text-center">Dokumentasi</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((item, idx) => (
                <tr key={item.id} className="border-b border-slate-200">
                  <td className="p-2 border border-slate-300 text-center font-mono">{idx + 1}.</td>
                  <td className="p-2 border border-slate-300 font-semibold">{item.kejuaraan}</td>
                  <td className="p-2 border border-slate-300">{item.nama_siswa}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono">{item.kelas}</td>
                  <td className="p-2 border border-slate-300 text-center font-mono capitalize">
                    {item.tingkat}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-mono">
                    {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-2 border border-slate-300 text-center font-bold">
                    {item.status === "sudah" ? (
                      <span className="text-emerald-700">✓ TUNTAS</span>
                    ) : (
                      <span className="text-amber-700">PENDING</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                    Tidak ada data kejuaraan yang sesuai dengan filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="pt-6 grid grid-cols-2 text-center text-xs">
            <div>
              <p className="text-slate-600 text-[10px]">Mengetahui,</p>
              <p className="text-slate-700 text-[11px] font-semibold">Ketua Divisi Fotografer</p>
              <div className="h-14 flex items-center justify-center my-1">
                <span className="font-serif italic text-slate-400 text-xs">(Tertanda Digital)</span>
              </div>
              <p className="font-bold text-slate-900 underline">Pengurus Divisi Fotografer</p>
              <p className="text-[10px] text-slate-600 font-mono">Broadcast Spensa</p>
            </div>
            <div>
              <p className="text-slate-600 text-[10px]">Sragen, {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
              <p className="text-slate-700 text-[11px] font-semibold">Dewan Pembina Broadcast</p>
              <div className="h-14 flex items-center justify-center my-1">
                <span className="font-serif italic text-slate-400 text-xs">(Tertanda Digital)</span>
              </div>
              <p className="font-bold text-slate-900 underline">Pembina Ekstrakurikuler</p>
              <p className="text-[10px] text-slate-600 font-mono">SMP Negeri 1 Sragen</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Normal Dashboard View ──────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-spectrum-cyan" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Rekor Kejuaraan &amp; Agenda Dokumentasi Foto
            </h1>
          </div>
          <p className="text-xs text-studio-text-secondary mt-1">
            Pencatatan prestasi lomba siswa Spensa dengan kurasi liputan foto oleh Pembina dan Divisi Fotografer.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsPrintMode(true)}
            aria-label="Cetak Rekapitulasi Lomba"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-studio-text-secondary hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak Rekap</span>
          </button>

          {canManage && (
            <button
              onClick={() => {
                setForm(EMPTY_FORM);
                setIsCreateOpen(true);
              }}
              aria-label="Daftarkan Kejuaraan Baru"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Daftarkan Lomba</span>
            </button>
          )}
        </div>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-studio-text-muted uppercase flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-spectrum-gold" /> Total Rekor Lomba
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{totalCount}</p>
          <p className="text-[10px] text-studio-text-secondary font-mono mt-0.5">Kejuaraan tercatat</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-jade uppercase flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Dokumentasi Tuntas
          </p>
          <p className="text-2xl font-bold font-mono text-spectrum-jade mt-1">{doneCount}</p>
          <p className="text-[10px] text-studio-text-secondary font-mono mt-0.5">Liputan siap &amp; arsip</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-amber uppercase flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Menunggu Liputan
          </p>
          <p className="text-2xl font-bold font-mono text-spectrum-amber mt-1">{pendingCount}</p>
          <p className="text-[10px] text-studio-text-secondary font-mono mt-0.5">Perlu dijadwalkan</p>
        </div>

        <div className="p-4 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-orbital-magenta uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Nasional / Provinsi
          </p>
          <p className="text-2xl font-bold font-mono text-white mt-1">{nasionalCount}</p>
          <p className="text-[10px] text-studio-text-secondary font-mono mt-0.5">Tingkat bergengsi</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama lomba, siswa, kelas, atau catatan..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white placeholder-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[42px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-studio-text-muted hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Tingkat & Status */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-surface-2 rounded-xl p-1 border border-studio-border-subtle">
            {(["all", "belum", "sudah"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filterStatus === s
                    ? "bg-spectrum-cyan text-ink font-bold shadow-cyan"
                    : "text-studio-text-secondary hover:text-white"
                }`}
              >
                {s === "all" ? "Semua Status" : s === "sudah" ? "Tuntas" : "Belum"}
              </button>
            ))}
          </div>

          <select
            value={filterTingkat}
            onChange={(e) => setFilterTingkat(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[42px]"
          >
            <option value="all">Semua Tingkat</option>
            <option value="nasional">Nasional</option>
            <option value="provinsi">Provinsi</option>
            <option value="kota">Kota</option>
            <option value="kabupaten">Kabupaten</option>
            <option value="kecamatan">Kecamatan</option>
            <option value="sekolah">Sekolah</option>
          </select>
        </div>
      </div>

      {/* Grid of Championships */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item) => {
          const isDone = item.status === "sudah";
          const tingkatCfg = TINGKAT_LABELS[item.tingkat] || TINGKAT_LABELS.kota;

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all flex flex-col justify-between space-y-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${tingkatCfg.badgeClass}`}
                  >
                    {tingkatCfg.label}
                  </span>
                  <StatusBadge
                    label={isDone ? "DOKUMENTASI TUNTAS" : "BELUM LENGKAP"}
                    variant={isDone ? "jade" : "amber"}
                  />
                </div>

                <h3
                  onClick={() => setDetailItem(item)}
                  className="text-sm font-bold text-white leading-snug line-clamp-2 hover:text-spectrum-cyan transition-colors cursor-pointer"
                  title="Klik untuk melihat detail agenda lomba"
                >
                  {item.kejuaraan}
                </h3>

                <div
                  onClick={() => setDetailItem(item)}
                  className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle space-y-1.5 text-xs cursor-pointer hover:border-spectrum-cyan/40 transition-colors"
                  title="Klik untuk melihat detail agenda lomba"
                >
                  <p className="font-bold text-spectrum-cyan flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 shrink-0 text-spectrum-gold" />
                    <span className="truncate">{item.nama_siswa}</span>
                    <span className="font-mono text-studio-text-muted shrink-0">
                      ({item.kelas})
                    </span>
                  </p>
                  <p className="text-[11px] font-mono text-studio-text-secondary flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-studio-text-muted" />
                    <span>
                      {new Date(item.tanggal + "T00:00:00").toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </p>
                  {item.keterangan && (
                    <p className="text-[11px] text-studio-text-secondary font-mono italic pt-1 border-t border-studio-border-subtle line-clamp-2">
                      &quot;{item.keterangan}&quot;
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons: Status Toggle, View, Edit, Delete */}
              <div className="pt-3 border-t border-studio-border-subtle flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setDetailItem(item)}
                    title="Lihat Detail Kejuaraan"
                    aria-label={`Lihat detail ${item.kejuaraan}`}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-surface-2 hover:bg-surface-3 text-studio-text-secondary hover:text-white transition-colors border border-studio-border-subtle min-h-[36px]"
                  >
                    <Eye className="w-3.5 h-3.5 text-spectrum-cyan" />
                    <span>Detail</span>
                  </button>

                  {canManage && (
                    <>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        title="Edit Data Kejuaraan"
                        className="p-2 rounded-lg text-studio-text-muted hover:text-spectrum-cyan hover:bg-surface-2 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingItem(item)}
                        title="Hapus Data Kejuaraan"
                        className="p-2 rounded-lg text-studio-text-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>

                {canCurate ? (
                  <button
                    onClick={() => handleToggleStatus(item)}
                    aria-label={`Ubah status dokumentasi ${item.kejuaraan}`}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px] flex items-center gap-1.5 ${
                      isDone
                        ? "bg-surface-2 text-studio-text-secondary hover:text-white"
                        : "bg-spectrum-jade hover:bg-emerald-500 text-ink shadow-jade"
                    }`}
                  >
                    {isDone ? (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Tandai Belum</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Setujui Tuntas</span>
                      </>
                    )}
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-studio-text-muted">
                    {isDone ? "✓ Selesai" : "Menunggu Liputan"}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="p-12 text-center bg-surface-1 border border-studio-border-subtle rounded-2xl">
          <Camera className="w-10 h-10 text-studio-text-muted mx-auto mb-2 opacity-40" />
          <p className="text-sm font-semibold text-white">Tidak ada data kejuaraan ditemukan</p>
          <p className="text-xs text-studio-text-secondary mt-1">
            {searchQuery || filterStatus !== "all" || filterTingkat !== "all"
              ? "Coba ubah kata kunci atau setelan filter Anda."
              : "Belum ada agenda lomba terdaftar. Klik 'Daftarkan Lomba' untuk menambahkan."}
          </p>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {/* Create Modal */}
        {isCreateOpen && (
          <AgendaFotoFormModal
            key="create-modal"
            title="Daftarkan Kejuaraan Siswa Baru"
            form={form}
            setForm={setForm}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
            onClose={() => setIsCreateOpen(false)}
          />
        )}

        {/* Edit Modal */}
        {editingItem && (
          <AgendaFotoFormModal
            key="edit-modal"
            title="Edit Agenda Kejuaraan & Dokumentasi"
            form={form}
            setForm={setForm}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdate}
            onClose={() => {
              setEditingItem(null);
              setForm(EMPTY_FORM);
            }}
          />
        )}

        {/* Detail Modal */}
        {detailItem && (
          <AgendaFotoDetailModal
            item={detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={canManage ? () => handleOpenEdit(detailItem) : undefined}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deletingItem && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingItem(null)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative bg-surface-2 border border-rose-500/30 rounded-2xl max-w-sm w-full p-6 z-10 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 shrink-0">
                  <AlertCircle className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hapus Data Kejuaraan?</h3>
                  <p className="text-[11px] text-studio-text-secondary">
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs">
                <p className="font-bold text-white">{deletingItem.kejuaraan}</p>
                <p className="text-studio-text-secondary mt-0.5">
                  {deletingItem.nama_siswa} ({deletingItem.kelas})
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all min-h-[44px] disabled:opacity-50"
                >
                  {isSubmitting ? "Menghapus..." : "Ya, Hapus"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
