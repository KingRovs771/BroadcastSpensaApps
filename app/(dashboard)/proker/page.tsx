"use client";

import React, { useState, useMemo } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { ProkerItem } from "@/lib/mock/store";
import { KopSuratSpensa } from "@/components/modules/laporan/KopSuratSpensa";
import {
  Plus,
  CalendarDays,
  MapPin,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Role permission check ────────────────────────────────────────────────────
const PROKER_EDITORS = [
  "administrator",
  "pembina",
  "ketua_broadcast",
  "sekretaris",
  "bendahara",
] as const;

const STATUS_CONFIG = {
  terjadwal: {
    label: "Terjadwal",
    icon: Clock,
    className: "bg-spectrum-cobalt/20 text-sky-300 border-sky-500/30",
    printColor: "#1d4ed8",
  },
  selesai: {
    label: "Selesai",
    icon: CheckCircle2,
    className: "bg-spectrum-jade/20 text-emerald-300 border-emerald-500/30",
    printColor: "#15803d",
  },
  dibatalkan: {
    label: "Dibatalkan",
    icon: XCircle,
    className: "bg-red-500/20 text-red-300 border-red-500/30",
    printColor: "#b91c1c",
  },
};

// ── Calendar mini-view ───────────────────────────────────────────────────────
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

function ProkerCalendar({
  prokerList,
  onSelectDate,
  selectedDate,
}: {
  prokerList: ProkerItem[];
  onSelectDate: (date: string) => void;
  selectedDate: string | null;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const prokerDates = useMemo(() => {
    const set = new Set<string>();
    prokerList.forEach((p) => {
      if (p.tanggal.startsWith(`${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`)) {
        set.add(p.tanggal);
      }
    });
    return set;
  }, [prokerList, viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={prevMonth}
          aria-label="Bulan sebelumnya"
          className="p-1.5 rounded-lg hover:bg-surface-2 text-studio-text-secondary hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-white">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          aria-label="Bulan berikutnya"
          className="p-1.5 rounded-lg hover:bg-surface-2 text-studio-text-secondary hover:text-white transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[9px] font-mono font-bold text-studio-text-muted uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;

          const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = dateStr === today.toISOString().split("T")[0];
          const hasProker = prokerDates.has(dateStr);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              aria-label={`Tanggal ${day}`}
              className={`relative h-8 w-full rounded-lg text-[11px] font-semibold transition-all ${
                isSelected
                  ? "bg-spectrum-cobalt text-ink font-extrabold"
                  : isToday
                  ? "bg-spectrum-gold/20 text-spectrum-gold border border-spectrum-gold/40"
                  : "text-studio-text-secondary hover:bg-surface-2 hover:text-white"
              }`}
            >
              {day}
              {hasProker && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-spectrum-jade" />
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[9px] text-studio-text-muted mt-2 text-center font-mono">
        · Titik hijau = ada kegiatan
      </p>
    </div>
  );
}

// ── Form Data Interface ──────────────────────────────────────────────────────
interface ProkerFormData {
  nama_kegiatan: string;
  tanggal: string;
  waktu: string;
  lokasi: string;
  penanggung_jawab: string;
  deskripsi: string;
  status: ProkerItem["status"];
}

// ── Standalone ProkerFormModal (di luar ProkerPage agar tidak re-mount saat mengetik) ──
function ProkerFormModal({
  title,
  form,
  setForm,
  isSubmitting,
  onSubmit,
  onClose,
}: {
  title: string;
  form: ProkerFormData;
  setForm: React.Dispatch<React.SetStateAction<ProkerFormData>>;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proker-modal-title"
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
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-lg w-full p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10"
      >
        <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
          <h3 id="proker-modal-title" className="text-sm font-bold text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          {/* Nama Kegiatan */}
          <div>
            <label htmlFor="pk-nama" className="block text-xs font-semibold text-white mb-1">
              Nama Kegiatan *
            </label>
            <input
              id="pk-nama"
              type="text"
              required
              value={form.nama_kegiatan}
              onChange={(e) => setForm((prev) => ({ ...prev, nama_kegiatan: e.target.value }))}
              placeholder="Contoh: Rapat Koordinasi Produksi Q2"
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Tanggal */}
            <div>
              <label htmlFor="pk-tanggal" className="block text-xs font-semibold text-white mb-1">
                Tanggal *
              </label>
              <input
                id="pk-tanggal"
                type="date"
                required
                value={form.tanggal}
                onChange={(e) => setForm((prev) => ({ ...prev, tanggal: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>
            {/* Waktu */}
            <div>
              <label htmlFor="pk-waktu" className="block text-xs font-semibold text-white mb-1">
                Waktu
              </label>
              <input
                id="pk-waktu"
                type="text"
                value={form.waktu}
                onChange={(e) => setForm((prev) => ({ ...prev, waktu: e.target.value }))}
                placeholder="08.00 – 10.00 WIB"
                className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div>
            <label htmlFor="pk-lokasi" className="block text-xs font-semibold text-white mb-1">
              Lokasi
            </label>
            <input
              id="pk-lokasi"
              type="text"
              value={form.lokasi}
              onChange={(e) => setForm((prev) => ({ ...prev, lokasi: e.target.value }))}
              placeholder="Studio Broadcast / Aula Sekolah"
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Penanggung Jawab */}
          <div>
            <label htmlFor="pk-pj" className="block text-xs font-semibold text-white mb-1">
              Penanggung Jawab
            </label>
            <input
              id="pk-pj"
              type="text"
              value={form.penanggung_jawab}
              onChange={(e) => setForm((prev) => ({ ...prev, penanggung_jawab: e.target.value }))}
              placeholder="Nama PJ kegiatan"
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Deskripsi */}
          <div>
            <label htmlFor="pk-deskripsi" className="block text-xs font-semibold text-white mb-1">
              Deskripsi
            </label>
            <textarea
              id="pk-deskripsi"
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Uraian singkat tujuan dan kegiatan..."
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white font-mono focus:border-spectrum-cyan focus:outline-none"
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor="pk-status" className="block text-xs font-semibold text-white mb-1">
              Status
            </label>
            <select
              id="pk-status"
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: e.target.value as ProkerItem["status"] }))
              }
              className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            >
              <option value="terjadwal">Terjadwal</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
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
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ProkerPage() {
  const { currentUser, prokerList, setProkerList, refreshData, logAction, supabase } = useSession();

  const isEditor = PROKER_EDITORS.includes(currentUser.role as (typeof PROKER_EDITORS)[number]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProkerItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ProkerItem | null>(null);
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"semua" | "terjadwal" | "selesai" | "dibatalkan">("semua");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form state ────────────────────────────────────────────────────────────
  const emptyForm = {
    nama_kegiatan: "",
    tanggal: new Date().toISOString().split("T")[0],
    waktu: "",
    lokasi: "",
    penanggung_jawab: "",
    deskripsi: "",
    status: "terjadwal" as ProkerItem["status"],
  };
  const [form, setForm] = useState(emptyForm);

  // ── Filter logic ──────────────────────────────────────────────────────────
  const filteredProker = useMemo(() => {
    let list = [...prokerList];
    if (selectedCalendarDate) {
      list = list.filter((p) => p.tanggal === selectedCalendarDate);
    }
    if (filterStatus !== "semua") {
      list = list.filter((p) => p.status === filterStatus);
    }
    return list.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [prokerList, selectedCalendarDate, filterStatus]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("proker")
        .insert({
          nama_kegiatan: form.nama_kegiatan,
          tanggal: form.tanggal,
          waktu: form.waktu || null,
          lokasi: form.lokasi || null,
          penanggung_jawab: form.penanggung_jawab || null,
          deskripsi: form.deskripsi || null,
          status: form.status,
          dibuat_oleh: currentUser.id,
        })
        .select()
        .single();

      if (error) { alert(`Gagal menambah proker: ${error.message}`); return; }

      await refreshData();
      logAction("CREATE_PROKER", "proker", data?.id, `Tambah proker: ${form.nama_kegiatan}`);
      setForm(emptyForm);
      setIsCreateOpen(false);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("proker")
        .update({
          nama_kegiatan: form.nama_kegiatan,
          tanggal: form.tanggal,
          waktu: form.waktu || null,
          lokasi: form.lokasi || null,
          penanggung_jawab: form.penanggung_jawab || null,
          deskripsi: form.deskripsi || null,
          status: form.status,
        })
        .eq("id", editingItem.id);

      if (error) { alert(`Gagal update proker: ${error.message}`); return; }

      await refreshData();
      logAction("UPDATE_PROKER", "proker", editingItem.id, `Update proker: ${form.nama_kegiatan}`);
      setEditingItem(null);
      setForm(emptyForm);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingItem) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("proker")
        .delete()
        .eq("id", deletingItem.id);

      if (error) { alert(`Gagal hapus proker: ${error.message}`); return; }

      await refreshData();
      logAction("DELETE_PROKER", "proker", deletingItem.id, `Hapus proker: ${deletingItem.nama_kegiatan}`);
      setDeletingItem(null);
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (item: ProkerItem) => {
    setEditingItem(item);
    setForm({
      nama_kegiatan: item.nama_kegiatan,
      tanggal: item.tanggal,
      waktu: item.waktu || "",
      lokasi: item.lokasi || "",
      penanggung_jawab: item.penanggung_jawab || "",
      deskripsi: item.deskripsi || "",
      status: item.status,
    });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  };

  // ── Print View ─────────────────────────────────────────────────────────────
  if (isPrintMode) {
    return (
      <div className="space-y-4">
        <div className="print:hidden flex items-center gap-3">
          <button onClick={() => setIsPrintMode(false)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-2 text-xs text-studio-text-secondary hover:text-white border border-studio-border-subtle">
            <X className="w-4 h-4" /> Tutup Pratinjau
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt text-ink text-xs font-bold">
            <Printer className="w-4 h-4" /> Cetak PDF
          </button>
        </div>

        <div className="printable-document bg-white text-slate-900 rounded-2xl p-8 shadow-2xl max-w-4xl mx-auto border border-slate-200 font-sans print:p-0 print:border-none print:shadow-none">
          <KopSuratSpensa />
          <div className="text-center my-4">
            <h2 style={{ fontFamily: "serif", fontWeight: 700, fontSize: 14, textTransform: "uppercase", color: "#172554", letterSpacing: "0.06em" }}>
              PROGRAM KERJA EKSTRAKURIKULER BROADCAST CLUB
            </h2>
            <p style={{ fontFamily: "monospace", fontSize: 11, color: "#475569", marginTop: 4 }}>
              Tahun Pelajaran 2026/2027
            </p>
          </div>

          <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse", border: "1px solid #cbd5e1" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["No.", "Nama Kegiatan", "Tanggal", "Waktu", "Lokasi", "Penanggung Jawab", "Status"].map((h) => (
                  <th key={h} style={{ padding: "5px 7px", textAlign: "left", border: "1px solid #cbd5e1", fontFamily: "serif", fontWeight: 700, fontSize: 10 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProker.map((p, i) => (
                <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                  <td style={{ padding: "4px 7px", border: "1px solid #e2e8f0", fontFamily: "monospace" }}>{i + 1}.</td>
                  <td style={{ padding: "4px 7px", border: "1px solid #e2e8f0", fontWeight: 600 }}>{p.nama_kegiatan}</td>
                  <td style={{ padding: "4px 7px", border: "1px solid #e2e8f0", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                    {new Date(p.tanggal + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td style={{ padding: "4px 7px", border: "1px solid #e2e8f0" }}>{p.waktu || "-"}</td>
                  <td style={{ padding: "4px 7px", border: "1px solid #e2e8f0" }}>{p.lokasi || "-"}</td>
                  <td style={{ padding: "4px 7px", border: "1px solid #e2e8f0" }}>{p.penanggung_jawab || "-"}</td>
                  <td style={{ padding: "4px 7px", border: "1px solid #e2e8f0", fontWeight: 700, color: STATUS_CONFIG[p.status].printColor }}>
                    {STATUS_CONFIG[p.status].label}
                  </td>
                </tr>
              ))}
              {filteredProker.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: "12px", textAlign: "center", color: "#94a3b8", fontStyle: "italic" }}>Tidak ada data program kerja.</td>
                </tr>
              )}
            </tbody>
          </table>

          <p style={{ fontSize: 10, color: "#64748b", marginTop: 8, textAlign: "right", fontFamily: "monospace" }}>
            Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>
    );
  }

  // ── Normal View ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-spectrum-gold" />
            Program Kerja Broadcast Club
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Kalender & manajemen seluruh agenda kegiatan ekstrakurikuler Broadcast Spensa.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPrintMode(true)}
            aria-label="Cetak Program Kerja"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-2 border border-studio-border-subtle text-studio-text-secondary hover:text-white text-xs font-semibold transition-colors min-h-[44px]"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>
          {isEditor && (
            <button
              onClick={() => { setForm(emptyForm); setIsCreateOpen(true); }}
              aria-label="Tambah Proker"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-gold hover:bg-amber-400 text-ink text-xs font-bold transition-all shadow-glow-gold min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Proker</span>
            </button>
          )}
        </div>
      </div>

      {/* Content: Calendar + List */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar: Calendar */}
        <div className="space-y-4">
          <ProkerCalendar
            prokerList={prokerList}
            selectedDate={selectedCalendarDate}
            onSelectDate={(d) => setSelectedCalendarDate(selectedCalendarDate === d ? null : d)}
          />

          {/* Filter by Status */}
          <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-4">
            <p className="text-[10px] font-mono font-bold text-studio-text-muted uppercase mb-2">Filter Status</p>
            <div className="space-y-1">
              {(["semua", "terjadwal", "selesai", "dibatalkan"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                    filterStatus === s
                      ? "bg-spectrum-cobalt/20 text-sky-300 border border-sky-500/30"
                      : "text-studio-text-secondary hover:text-white hover:bg-surface-2"
                  }`}
                >
                  {s === "semua" ? "Semua Kegiatan" : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Selected date filter indicator */}
          {selectedCalendarDate && (
            <div className="flex items-center justify-between p-3 bg-spectrum-cobalt/10 border border-spectrum-cobalt/30 rounded-xl">
              <span className="text-xs text-sky-300 font-semibold">
                {new Date(selectedCalendarDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
              </span>
              <button
                onClick={() => setSelectedCalendarDate(null)}
                aria-label="Hapus filter tanggal"
                className="text-studio-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Main: Proker List */}
        <div className="space-y-3">
          {filteredProker.length === 0 ? (
            <div className="p-10 text-center bg-surface-1 border border-studio-border-subtle rounded-2xl">
              <FileText className="w-8 h-8 text-studio-text-muted mx-auto mb-2 opacity-40" />
              <p className="text-xs font-semibold text-white">Belum Ada Program Kerja</p>
              <p className="text-[11px] text-studio-text-secondary mt-1">
                {selectedCalendarDate
                  ? `Tidak ada kegiatan pada tanggal ini.`
                  : "Tambahkan kegiatan pertama dengan tombol di atas."}
              </p>
            </div>
          ) : (
            filteredProker.map((item) => {
              const StatusIcon = STATUS_CONFIG[item.status].icon;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_CONFIG[item.status].className}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[item.status].label}
                      </span>
                      <span className="text-[11px] font-mono text-spectrum-gold font-semibold">
                        {formatDate(item.tanggal)}
                      </span>
                      {item.waktu && (
                        <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.waktu}
                        </span>
                      )}
                    </div>

                    {isEditor && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(item)}
                          aria-label={`Edit ${item.nama_kegiatan}`}
                          className="p-2 rounded-lg text-studio-text-muted hover:text-spectrum-cyan hover:bg-surface-2 transition-colors min-h-[36px] min-w-[36px]"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          aria-label={`Hapus ${item.nama_kegiatan}`}
                          className="p-2 rounded-lg text-studio-text-muted hover:text-red-400 hover:bg-surface-2 transition-colors min-h-[36px] min-w-[36px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2">{item.nama_kegiatan}</h3>

                  <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-studio-text-secondary">
                    {item.lokasi && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {item.lokasi}
                      </span>
                    )}
                    {item.penanggung_jawab && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> PJ: {item.penanggung_jawab}
                      </span>
                    )}
                  </div>

                  {item.deskripsi && (
                    <p className="mt-2 text-[11px] text-studio-text-secondary font-mono whitespace-pre-wrap">
                      {item.deskripsi}
                    </p>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <ProkerFormModal
            key="create"
            title="Tambah Program Kerja"
            form={form}
            setForm={setForm}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
            onClose={() => setIsCreateOpen(false)}
          />
        )}
        {editingItem && (
          <ProkerFormModal
            key="edit"
            title="Edit Program Kerja"
            form={form}
            setForm={setForm}
            isSubmitting={isSubmitting}
            onSubmit={handleUpdate}
            onClose={() => {
              setEditingItem(null);
              setForm(emptyForm);
            }}
          />
        )}
        {deletingItem && (
          <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingItem(null)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2 }}
              className="relative bg-surface-2 border border-red-500/30 rounded-2xl max-w-sm w-full p-6 z-10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Hapus Program Kerja?</h3>
                  <p className="text-[11px] text-studio-text-secondary mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
                </div>
              </div>
              <p className="text-xs text-studio-text-secondary bg-surface-1 rounded-xl p-3 border border-studio-border-subtle mb-4">
                <strong className="text-white">{deletingItem.nama_kegiatan}</strong> — {formatDate(deletingItem.tanggal)}
              </p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={() => setDeletingItem(null)} className="px-4 py-2 text-xs font-semibold text-studio-text-secondary hover:text-white rounded-lg min-h-[44px]">
                  Batal
                </button>
                <button
                  onClick={handleDelete} disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-all min-h-[44px] disabled:opacity-50"
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
