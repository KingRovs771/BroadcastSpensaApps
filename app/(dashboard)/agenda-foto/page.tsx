"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { AgendaFoto } from "@/lib/mock/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Camera,
  Plus,
  Trophy,
  CheckCircle2,
  Clock,
  X,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AgendaFotoPage() {
  const { currentUser, agendaFotoList, refreshData, logAction, supabase } =
    useSession();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [namaSiswa, setNamaSiswa] = useState("");
  const [kelas, setKelas] = useState("");
  const [kejuaraan, setKejuaraan] = useState("");
  const [tingkat, setTingkat] = useState<AgendaFoto["tingkat"]>("kota");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [keterangan, setKeterangan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSekretarisOrAdmin =
    currentUser.role === "sekretaris" || currentUser.role === "administrator";

  const isKetuaFotografer =
    (currentUser.role === "ketua_divisi" && currentUser.divisi === "Fotografer") ||
    currentUser.role === "administrator";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from("agenda_foto")
        .insert({
          nama_siswa: namaSiswa,
          kelas,
          kejuaraan,
          tingkat,
          tanggal,
          status: "belum",
          keterangan: keterangan || null,
          divisi: "Fotografer",
          dibuat_oleh: currentUser.id,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase insert agenda_foto error:", error);
        alert(`Gagal mendaftarkan kejuaraan: ${error.message}`);
        setIsSubmitting(false);
        return;
      }

      await refreshData();
      logAction(
        "CREATE_AGENDA_FOTO",
        "agenda_foto",
        data?.id || "new",
        `Mendaftarkan agenda dokumentasi lomba: ${kejuaraan} (${namaSiswa})`
      );

      setNamaSiswa("");
      setKelas("");
      setKejuaraan("");
      setKeterangan("");
      setIsModalOpen(false);
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (item: AgendaFoto) => {
    if (!isKetuaFotografer) {
      alert("Hanya Ketua Divisi Fotografer yang berhak memperbarui status dokumentasi liputan lomba!");
      return;
    }

    const nextStatus = item.status === "sudah" ? "belum" : "sudah";

    try {
      const { error } = await supabase
        .from("agenda_foto")
        .update({
          status: nextStatus,
          diupdate_oleh: currentUser.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (error) {
        console.error("Supabase update agenda_foto error:", error);
        alert(`Gagal memperbarui status: ${error.message}`);
        return;
      }

      await refreshData();
      logAction(
        "CURATE_AGENDA_FOTO",
        "agenda_foto",
        item.id,
        `Ketua Divisi Fotografer mengubah status dokumentasi ${item.kejuaraan} menjadi ${nextStatus.toUpperCase()}`
      );
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
            <Camera className="w-5 h-5 text-spectrum-cyan" />
            Rekor Kejuaraan & Agenda Dokumentasi Foto
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Pencatatan prestasi lomba siswa Spensa dengan kurasi status tuntas eksklusif oleh Ketua Divisi Fotografer.
          </p>
        </div>

        {isSekretarisOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Daftarkan Kejuaraan Baru"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Daftarkan Kejuaraan</span>
          </button>
        )}
      </div>

      {/* Grid of Championships */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agendaFotoList.map((item) => {
          const isDone = item.status === "sudah";

          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/30">
                    Tingkat {item.tingkat}
                  </span>
                  <StatusBadge
                    label={isDone ? "DOKUMENTASI TUNTAS" : "BELUM LENGKAP"}
                    variant={isDone ? "jade" : "amber"}
                  />
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {item.kejuaraan}
                </h3>

                <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle space-y-1 text-xs">
                  <p className="font-bold text-spectrum-cyan flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{item.nama_siswa}</span>
                    <span className="font-mono text-studio-text-muted">({item.kelas})</span>
                  </p>
                  <p className="text-[11px] font-mono text-studio-text-secondary flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{item.tanggal}</span>
                  </p>
                  {item.keterangan && (
                    <p className="text-[11px] text-studio-text-secondary italic pt-1 border-t border-studio-border-subtle">
                      "{item.keterangan}"
                    </p>
                  )}
                </div>
              </div>

              {/* Kurasi action by Ketua Divisi Fotografer */}
              <div className="pt-3 border-t border-studio-border-subtle flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono text-studio-text-muted">
                  Kurator: Ketua Fotografer
                </span>

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
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Daftar Lomba Baru */}
      {/* Modal Tambah Agenda Foto */}
      <AnimatePresence>
        {isModalOpen && (
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
                <h3 id="foto-modal-title" className="text-base font-bold text-white">
                  Daftarkan Agenda Kejuaraan Siswa
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
                <label htmlFor="foto-kejuaraan" className="block text-xs font-semibold text-white mb-1">
                  Nama Kejuaraan / Kompetisi *
                </label>
                <input
                  id="foto-kejuaraan"
                  type="text"
                  required
                  value={kejuaraan}
                  onChange={(e) => setKejuaraan(e.target.value)}
                  placeholder="Contoh: Lomba Robotik Tingkat Nasional 2026"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="foto-siswa" className="block text-xs font-semibold text-white mb-1">
                    Nama Siswa *
                  </label>
                  <input
                    id="foto-siswa"
                    type="text"
                    required
                    value={namaSiswa}
                    onChange={(e) => setNamaSiswa(e.target.value)}
                    placeholder="Contoh: Clarissa Putri"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="foto-kelas" className="block text-xs font-semibold text-white mb-1">
                    Kelas *
                  </label>
                  <input
                    id="foto-kelas"
                    type="text"
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="IX-A"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="foto-tingkat" className="block text-xs font-semibold text-white mb-1">
                    Tingkat Lomba *
                  </label>
                  <select
                    id="foto-tingkat"
                    value={tingkat}
                    onChange={(e) => setTingkat(e.target.value as any)}
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
                  <label htmlFor="foto-tgl" className="block text-xs font-semibold text-white mb-1">
                    Tanggal Kegiatan *
                  </label>
                  <input
                    id="foto-tgl"
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="foto-ket" className="block text-xs font-semibold text-white mb-1">
                  Catatan / Keterangan
                </label>
                <textarea
                  id="foto-ket"
                  rows={2}
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Detail pose foto panggung atau wawancara kepala sekolah..."
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none"
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
                  Simpan Agenda
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

