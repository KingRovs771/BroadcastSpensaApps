"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { NotulenItem } from "@/lib/mock/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  FileText,
  Plus,
  Lock,
  Download,
  Calendar,
  MapPin,
  CheckCircle2,
  X,
  Printer,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function NotulenPage() {
  const { currentUser, notulenList, setNotulenList, logAction } = useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNotulenForView, setSelectedNotulenForView] = useState<NotulenItem | null>(null);

  const [judul, setJudul] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [tempat, setTempat] = useState("Studio Broadcast Spensa");
  const [agenda, setAgenda] = useState("");
  const [isiNotulen, setIsiNotulen] = useState("");
  const [keputusan, setKeputusan] = useState("");

  const isSekretarisOrAdmin =
    currentUser.role === "sekretaris" || currentUser.role === "administrator";
  const isKetuaOrAdmin =
    currentUser.role === "ketua_broadcast" || currentUser.role === "administrator";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const newNotulen: NotulenItem = {
      id: `not-${Date.now()}`,
      judul,
      tanggal_rapat: tanggal,
      tempat,
      agenda,
      isi_notulen: isiNotulen,
      keputusan,
      status: "draft",
      dibuat_oleh: `${currentUser.nama} (Sekretaris)`,
    };

    setNotulenList((prev) => [newNotulen, ...prev]);
    logAction(
      "CREATE_NOTULEN",
      "notulen",
      newNotulen.id,
      `Sekretaris membuat draft notulen: ${judul}`
    );

    // Reset
    setJudul("");
    setAgenda("");
    setIsiNotulen("");
    setKeputusan("");
    setIsModalOpen(false);
  };

  const handleFinalizeLock = (notulenId: string) => {
    if (!isKetuaOrAdmin) {
      alert("Hanya Ketua Broadcast yang berwenang mengesahkan dan mengunci risalah rapat!");
      return;
    }

    setNotulenList((prev) =>
      prev.map((n) => {
        if (n.id === notulenId) {
          return {
            ...n,
            status: "final",
            disetujui_oleh: `${currentUser.nama} (Ketua Broadcast)`,
            disetujui_at: new Date().toISOString(),
          };
        }
        return n;
      })
    );

    logAction(
      "FINALIZE_NOTULEN",
      "notulen",
      notulenId,
      `Ketua Broadcast mengesahkan status FINAL notulen rapat`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-spectrum-gold" />
            Notulen & Risalah Musyawarah
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Penyusunan risalah rapat terstruktur dan penguncian digital mutlak oleh Ketua Broadcast.
          </p>
        </div>

        {isSekretarisOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Tulis Notulen Baru"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tulis Notulen Baru</span>
          </button>
        )}
      </div>

      {/* List of Notulen */}
      <div className="space-y-4">
        {notulenList.map((notulen) => {
          const isFinal = notulen.status === "final";

          return (
            <div
              key={notulen.id}
              className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <StatusBadge
                    label={isFinal ? "FINAL (TERKUNCI)" : "DRAFT (TERBUKA)"}
                    variant={isFinal ? "jade" : "gold"}
                  />
                  <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {notulen.tanggal_rapat}
                  </span>
                  <span className="text-[11px] font-mono text-studio-text-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {notulen.tempat}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!isFinal && isKetuaOrAdmin && (
                    <button
                      onClick={() => handleFinalizeLock(notulen.id)}
                      aria-label="Kunci dan sahkan notulen"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-spectrum-jade hover:bg-emerald-500 text-ink text-xs font-bold transition-colors shadow-jade min-h-[36px]"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sahkan & Kunci Notulen</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedNotulenForView(notulen)}
                    aria-label="Lihat detail risalah"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-studio-text-secondary hover:text-white text-xs font-semibold border border-studio-border-subtle transition-colors min-h-[36px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Tinjau Risalah</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white">{notulen.judul}</h3>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle">
                    <span className="text-[10px] font-mono font-bold text-spectrum-cyan uppercase block mb-1">
                      Agenda & Pembahasan:
                    </span>
                    <p className="text-studio-text-secondary whitespace-pre-line font-mono text-[11px]">
                      {notulen.isi_notulen}
                    </p>
                  </div>
                  <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle">
                    <span className="text-[10px] font-mono font-bold text-spectrum-jade uppercase block mb-1">
                      Keputusan Musyawarah:
                    </span>
                    <p className="text-white whitespace-pre-line font-mono text-[11px]">
                      {notulen.keputusan}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-studio-border-subtle text-[11px] font-mono text-studio-text-muted">
                <span>Dibuat: {notulen.dibuat_oleh}</span>
                {notulen.disetujui_oleh && (
                  <span className="text-spectrum-jade font-semibold">
                    ✓ Disahkan: {notulen.disetujui_oleh}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal New Notulen */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-notulen-title"
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
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-xl w-full p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
                <h3 id="new-notulen-title" className="text-base font-bold text-white">
                  Tulis Notulen Rapat Baru
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
              <div>
                <label htmlFor="not-judul" className="block text-xs font-semibold text-white mb-1">
                  Judul Rapat *
                </label>
                <input
                  id="not-judul"
                  type="text"
                  required
                  value={judul}
                  onChange={(e) => setJudul(e.target.value)}
                  placeholder="Contoh: Rapat Koordinasi Liputan Dies Natalis ke-75"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="not-tgl" className="block text-xs font-semibold text-white mb-1">
                    Tanggal Rapat *
                  </label>
                  <input
                    id="not-tgl"
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="not-tempat" className="block text-xs font-semibold text-white mb-1">
                    Tempat / Ruangan *
                  </label>
                  <input
                    id="not-tempat"
                    type="text"
                    required
                    value={tempat}
                    onChange={(e) => setTempat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="not-agenda" className="block text-xs font-semibold text-white mb-1">
                  Agenda Pokok
                </label>
                <input
                  id="not-agenda"
                  type="text"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  placeholder="1. Pembagian kru kamera, 2. Target upload"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="not-isi" className="block text-xs font-semibold text-white mb-1">
                  Uraian Pembahasan Rapat *
                </label>
                <textarea
                  id="not-isi"
                  rows={4}
                  required
                  value={isiNotulen}
                  onChange={(e) => setIsiNotulen(e.target.value)}
                  placeholder="Catat rangkuman masukan dari masing-masing divisi dan pengurus..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white font-mono focus:border-spectrum-cyan focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="not-keputusan" className="block text-xs font-semibold text-white mb-1">
                  Keputusan Musyawarah *
                </label>
                <textarea
                  id="not-keputusan"
                  rows={2}
                  required
                  value={keputusan}
                  onChange={(e) => setKeputusan(e.target.value)}
                  placeholder="Keputusan final yang disepakati bersama..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white font-mono focus:border-spectrum-cyan focus:outline-none"
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
                  className="px-5 py-2 text-xs font-bold text-ink bg-spectrum-cobalt hover:bg-sky-400 rounded-lg transition-all shadow-cyan min-h-[44px]"
                >
                  Simpan Draft Notulen
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* Modal View & Print Preview with Kop Surat Spensa */}
      <AnimatePresence>
        {selectedNotulenForView && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedNotulenForView(null)}
              className="fixed inset-0 bg-cosmic/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
                <span className="text-xs font-mono font-bold text-spectrum-cyan uppercase">
                  Pratinjau Dokumen Risalah Resmi
                </span>
                <button
                  onClick={() => setSelectedNotulenForView(null)}
                  aria-label="Tutup pratinjau"
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Document Body simulating official print format */}
              <div className="printable-document mt-4 p-6 bg-white text-slate-900 rounded-xl space-y-4 font-sans">
                {/* Kop Surat Mini */}
                <div className="text-center border-b-2 border-black pb-3">
                  <h2 className="font-serif font-bold text-sm tracking-wider uppercase">
                    PEMERINTAH KOTA · DINAS PENDIDIKAN
                  </h2>
                  <h1 className="font-serif font-extrabold text-base tracking-widest text-blue-900 uppercase">
                    SMP NEGERI 1 (SPENSA)
                  </h1>
                  <p className="text-[10px] text-slate-600">
                    EKSTRAKURIKULER BROADCAST & MULTIMEDIA SPENSA
                  </p>
                  <p className="text-[9px] text-slate-500 font-mono">
                    Jl. Veteran No. 1, Kota · broadcast@spensa.sch.id
                  </p>
                </div>

                <div className="text-center my-3">
                  <h3 className="font-serif font-bold text-sm uppercase underline">
                    {selectedNotulenForView.judul}
                  </h3>
                  <p className="text-[11px] font-mono text-slate-600">
                    Tanggal: {selectedNotulenForView.tanggal_rapat} · Tempat: {selectedNotulenForView.tempat}
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Agenda Rapat:</h4>
                    <p className="text-slate-700">{selectedNotulenForView.agenda}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Uraian & Pembahasan:</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedNotulenForView.isi_notulen}</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 uppercase text-[11px]">Keputusan Musyawarah:</h4>
                    <p className="text-slate-700 whitespace-pre-wrap">{selectedNotulenForView.keputusan}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-xs">
                  <div>
                    <p className="text-slate-600 text-[10px]">Dicatat Oleh:</p>
                    <p className="mt-8 font-bold text-slate-900">{selectedNotulenForView.dibuat_oleh}</p>
                    <p className="text-[10px] text-slate-600">Sekretaris Broadcast</p>
                  </div>
                  <div>
                    <p className="text-slate-600 text-[10px]">Disahkan Oleh:</p>
                    <p className="mt-8 font-bold text-slate-900">
                      {selectedNotulenForView.disetujui_oleh || "Menunggu Pengesahan"}
                    </p>
                    <p className="text-[10px] text-slate-600">Ketua Broadcast Spensa</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-spectrum-cobalt text-ink text-xs font-bold flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak / Simpan PDF</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
