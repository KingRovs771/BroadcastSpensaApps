"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { AnggotaRecord, DivisiName } from "@/lib/mock/store";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import {
  Users,
  Plus,
  Search,
  Award,
  Filter,
  X,
  Phone,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AnggotaPage() {
  const { currentUser, anggotaList, setAnggotaList, logAction } = useSession();

  const [activeTab, setActiveTab] = useState<"tetap" | "ekskul">("tetap");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [namaLengkap, setNamaLengkap] = useState("");
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [kelas, setKelas] = useState("VIII-A");
  const [jabatan, setJabatan] = useState("Anggota");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [noHp, setNoHp] = useState("");

  const isSekretarisOrAdmin =
    currentUser.role === "sekretaris" || currentUser.role === "administrator";

  const filteredMembers = anggotaList
    .filter((a) => a.tipe === activeTab)
    .filter((a) =>
      a.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nis.includes(searchQuery) ||
      a.kelas.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    const newAnggota: AnggotaRecord = {
      id: `ang-${Date.now()}`,
      tipe: activeTab,
      nama_lengkap: namaLengkap,
      nis,
      nisn: nisn || undefined,
      kelas,
      jabatan,
      divisi: activeTab === "tetap" ? divisi : undefined,
      tahun_ajaran: "2026/2027",
      status: "aktif",
      no_hp: noHp || undefined,
    };

    setAnggotaList((prev) => [...prev, newAnggota]);
    logAction(
      "REGISTER_ANGGOTA",
      "anggota",
      newAnggota.id,
      `Mendaftarkan ${activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}: ${namaLengkap} (${kelas})`
    );

    setNamaLengkap("");
    setNis("");
    setNisn("");
    setNoHp("");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-spectrum-cyan" />
            Buku Induk Anggota Broadcast Spensa
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Manajemen direktori peserta ekstrakurikuler terbagi antara Anggota Tetap dan Ekskul.
          </p>
        </div>

        {isSekretarisOrAdmin && (
          <button
            onClick={() => setIsModalOpen(true)}
            aria-label="Registrasi Anggota Baru"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}</span>
          </button>
        )}
      </div>

      {/* Tabs Segregation */}
      <div className="flex items-center gap-4 border-b border-studio-border-subtle">
        <button
          onClick={() => setActiveTab("tetap")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all ${
            activeTab === "tetap"
              ? "text-spectrum-cyan border-b-2 border-spectrum-cyan font-extrabold shadow-cyan"
              : "text-studio-text-secondary hover:text-white"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Anggota Tetap</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/30">
            {anggotaList.filter((a) => a.tipe === "tetap").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ekskul")}
          className={`flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all ${
            activeTab === "ekskul"
              ? "text-orbital-magenta border-b-2 border-orbital-violet font-extrabold shadow-orbital"
              : "text-studio-text-secondary hover:text-white"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Anggota Ekskul</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/30">
            {anggotaList.filter((a) => a.tipe === "ekskul").length}
          </span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          aria-label="Cari nama, NIS, atau kelas"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama, NIS, atau kelas siswa..."
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
        />
      </div>

      {/* Member Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((ang) => (
          <div
            key={ang.id}
            className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-studio-border-medium transition-all space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-surface-2 text-white border border-studio-border-subtle">
                NIS: {ang.nis}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-spectrum-jade/15 text-spectrum-jade border border-spectrum-jade/30">
                {ang.status.toUpperCase()}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-white leading-snug">
                {ang.nama_lengkap}
              </h3>
              <p className="text-xs text-studio-text-secondary mt-0.5 font-mono">
                Kelas {ang.kelas} · TA {ang.tahun_ajaran}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle space-y-1 text-xs">
              <div className="flex justify-between text-studio-text-secondary">
                <span>Jabatan:</span>
                <strong className="text-white">{ang.jabatan}</strong>
              </div>
              {ang.divisi && (
                <div className="flex justify-between text-studio-text-secondary">
                  <span>Divisi:</span>
                  <span className="text-spectrum-cyan font-semibold">{ang.divisi}</span>
                </div>
              )}
              {ang.no_hp && (
                <div className="flex justify-between text-studio-text-secondary pt-1 border-t border-studio-border-subtle">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" /> WhatsApp:
                  </span>
                  <span className="font-mono text-white">{ang.no_hp}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Anggota */}
      <AnimatePresence>
        {isModalOpen && (
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
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-cosmic/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative bg-surface-2 border border-studio-border-medium rounded-2xl max-w-md w-full p-6 shadow-orbital overflow-y-auto max-h-[90vh] z-10"
            >
              <div className="flex items-center justify-between pb-4 border-b border-studio-border-subtle">
                <h3 className="text-base font-bold text-white">
                  Registrasi {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Nama Lengkap Siswa *
                </label>
                <input
                  type="text"
                  required
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Contoh: Muhammad Farhan"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Nomor Induk Siswa (NIS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={nis}
                    onChange={(e) => setNis(e.target.value)}
                    placeholder="89401"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Kelas *
                  </label>
                  <input
                    type="text"
                    required
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value)}
                    placeholder="VII-C / VIII-A"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Jabatan Struktural
                  </label>
                  <input
                    type="text"
                    value={jabatan}
                    onChange={(e) => setJabatan(e.target.value)}
                    placeholder="Anggota / Staf Divisi"
                    className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-white mb-1">
                    Divisi Penempatan
                  </label>
                  <select
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1">
                  Nomor WhatsApp (Opsional)
                </label>
                <input
                  type="text"
                  value={noHp}
                  onChange={(e) => setNoHp(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
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
                  Daftarkan Anggota
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

