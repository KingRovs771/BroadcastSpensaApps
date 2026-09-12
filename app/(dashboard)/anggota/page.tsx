"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { AnggotaRecord, DivisiName } from "@/lib/mock/store";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import { createClient } from "@/lib/supabase/client";
import { TambahPembinaModal } from "@/components/modules/pembina/TambahPembinaModal";
import {
  Users,
  Plus,
  Search,
  Award,
  Filter,
  X,
  Phone,
  GraduationCap,
  Mail,
  Shield,
  UserCheck,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Pilihan Dropdown ──────────────────────────────────────────────────────────
const TINGKAT_KELAS_OPTIONS = ["VII", "VIII", "IX"] as const;
const ROMBEL_OPTIONS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"
] as const;

const JABATAN_ROLE_OPTIONS = [
  "Anggota",
  "Ketua Umum Broadcast",
  "Wakil Ketua Broadcast",
  "Ketua Divisi",
  "Sekretaris 1",
  "Sekretaris 2",
  "Bendahara 1",
  "Bendahara 2",
  "Penanggung Jawab (PJ)",
  "Staf Divisi Kreatif",
  "Staf Teknis Studio",
] as const;

export default function AnggotaPage() {
  const supabase = createClient();
  const {
    currentUser,
    anggotaList,
    setAnggotaList,
    pembinaList,
    logAction,
  } = useSession();

  const [activeTab, setActiveTab] = useState<"tetap" | "ekskul" | "pembina">("tetap");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPembinaModalOpen, setIsPembinaModalOpen] = useState(false);

  // Form states untuk Anggota
  const [namaLengkap, setNamaLengkap] = useState("");
  const [nis, setNis] = useState("");
  const [nisn, setNisn] = useState("");
  const [tingkatKelas, setTingkatKelas] = useState<"VII" | "VIII" | "IX">("VIII");
  const [rombelKelas, setRombelKelas] = useState<string>("A");
  const [jabatan, setJabatan] = useState<string>("Anggota");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [noHp, setNoHp] = useState("");

  const isSekretarisOrAdmin =
    currentUser.role === "sekretaris" || currentUser.role === "administrator";

  const isPembinaOrAdmin =
    currentUser.role === "pembina" || currentUser.role === "administrator";

  // Filter anggota berdasarkan tab & search
  const filteredMembers = anggotaList
    .filter((a) => a.tipe === activeTab)
    .filter((a) =>
      a.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.nis.includes(searchQuery) ||
      a.kelas.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Filter pembina
  const filteredPembina = pembinaList.filter(
    (p) =>
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedKelas = `${tingkatKelas}-${rombelKelas}`;
    const tempId = `ang-${Date.now()}`;
    const newAnggota: AnggotaRecord = {
      id: tempId,
      tipe: activeTab as "tetap" | "ekskul",
      nama_lengkap: namaLengkap,
      nis,
      nisn: nisn || undefined,
      kelas: selectedKelas,
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
      `Mendaftarkan ${activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}: ${namaLengkap} (${selectedKelas}) - ${jabatan}`
    );

    try {
      const { data } = await supabase
        .from("anggota")
        .insert({
          tipe: activeTab,
          nama_lengkap: namaLengkap,
          nis,
          nisn: nisn || null,
          kelas: selectedKelas,
          jabatan,
          divisi: activeTab === "tetap" ? divisi : null,
          tahun_ajaran: "2026/2027",
          status: "aktif",
          no_hp: noHp || null,
        })
        .select()
        .single();

      if (data) {
        setAnggotaList((prev) =>
          prev.map((a) => (a.id === tempId ? (data as AnggotaRecord) : a))
        );
      }
    } catch (err) {
      console.error("Error inserting anggota to Supabase:", err);
    }

    setNamaLengkap("");
    setNis("");
    setNisn("");
    setNoHp("");
    setTingkatKelas("VIII");
    setRombelKelas("A");
    setJabatan("Anggota");
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-spectrum-cyan" />
            Buku Induk Anggota & Pembina Broadcast Spensa
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Direktori resmi anggota ekstrakurikuler (Tetap &amp; Ekskul) serta Dewan Pembina SMPN 1 Spensa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === "pembina" ? (
            isPembinaOrAdmin && (
              <button
                onClick={() => setIsPembinaModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg shadow-violet-900/40 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Pembina</span>
              </button>
            )
          ) : (
            isSekretarisOrAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                aria-label="Registrasi Anggota Baru"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Tabs Segregation (3 Tab: Tetap, Ekskul, Pembina) */}
      <div className="flex items-center gap-2 sm:gap-4 border-b border-studio-border-subtle overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("tetap")}
          className={`flex items-center gap-2 pb-3 px-3 sm:px-4 text-xs font-bold transition-all whitespace-nowrap ${
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
          className={`flex items-center gap-2 pb-3 px-3 sm:px-4 text-xs font-bold transition-all whitespace-nowrap ${
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

        <button
          onClick={() => setActiveTab("pembina")}
          className={`flex items-center gap-2 pb-3 px-3 sm:px-4 text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === "pembina"
              ? "text-spectrum-amber border-b-2 border-spectrum-amber font-extrabold shadow-amber"
              : "text-studio-text-secondary hover:text-white"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Dewan Pembina</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-spectrum-amber/20 text-spectrum-amber border border-spectrum-amber/30">
            {pembinaList.length}
          </span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          aria-label="Cari data"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            activeTab === "pembina"
              ? "Cari nama atau email pembina..."
              : "Cari nama, NIS, atau kelas siswa..."
          }
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
        />
      </div>

      {/* ── Content: Dewan Pembina View ────────────────────────────────────────── */}
      {activeTab === "pembina" ? (
        filteredPembina.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-surface-1 border border-studio-border-subtle border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/15 border border-violet-500/20 text-violet-400 mx-auto flex items-center justify-center mb-3">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">Belum Ada Dewan Pembina Terdaftar</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Tambahkan guru pembina ekstrakurikuler untuk memberikan hak supervisi dan pengesahan naskah.
            </p>
            {isPembinaOrAdmin && (
              <button
                onClick={() => setIsPembinaModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold transition-all shadow-lg inline-flex items-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Pembina Baru</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPembina.map((pem) => (
              <div
                key={pem.id}
                className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle hover:border-violet-500/40 transition-all space-y-3 relative group"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/35">
                    DEWAN PEMBINA
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    AKTIF
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600/30 to-pink-600/30 border border-violet-500/30 flex items-center justify-center text-violet-300 font-bold text-base shrink-0">
                    {pem.nama.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white leading-snug truncate">
                      {pem.nama}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                      <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                      {pem.email}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Otoritas:</span>
                    <span className="text-white font-semibold">Supervisi &amp; Approval Gate 1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Akses:</span>
                    <span className="text-spectrum-cyan font-mono">Monitoring Center</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Content: Anggota Tetap / Ekskul Grid ────────────────────────────── */
        filteredMembers.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-surface-1 border border-studio-border-subtle border-dashed">
            <div className="w-14 h-14 rounded-2xl bg-surface-2 border border-studio-border-subtle text-slate-500 mx-auto flex items-center justify-center mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">
              Belum Ada Data {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Daftarkan siswa baru ke direktori buku induk melalui tombol di bawah ini.
            </p>
            {isSekretarisOrAdmin && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan inline-flex items-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah {activeTab === "tetap" ? "Anggota Tetap" : "Anggota Ekskul"}</span>
              </button>
            )}
          </div>
        ) : (
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
        )
      )}

      {/* ── Modal Tambah Anggota ─────────────────────────────────────────────── */}
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
                  className="p-1.5 rounded-lg text-studio-text-secondary hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-4">
                {/* Nama Lengkap */}
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

                {/* NIS & Dropdown Kelas (Tingkat + Rombel) */}
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
                      Kelas (Tingkat &amp; Rombel) *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        aria-label="Tingkat Kelas"
                        value={tingkatKelas}
                        onChange={(e) => setTingkatKelas(e.target.value as "VII" | "VIII" | "IX")}
                        className="w-full px-2.5 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                      >
                        {TINGKAT_KELAS_OPTIONS.map((t) => (
                          <option key={t} value={t} className="bg-surface-2 text-white">
                            Kelas {t}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="Ruang Rombel"
                        value={rombelKelas}
                        onChange={(e) => setRombelKelas(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                      >
                        {ROMBEL_OPTIONS.map((r) => (
                          <option key={r} value={r} className="bg-surface-2 text-white">
                            Ruang {r}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      Pilihan: <span className="text-spectrum-cyan font-bold">{tingkatKelas}-{rombelKelas}</span>
                    </p>
                  </div>
                </div>

                {/* Jabatan Struktural Dropdown (Sesuai Role) & Divisi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      Jabatan Struktural (Sesuai Role) *
                    </label>
                    <select
                      value={jabatan}
                      onChange={(e) => setJabatan(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    >
                      {JABATAN_ROLE_OPTIONS.map((j) => (
                        <option key={j} value={j} className="bg-surface-2 text-white">
                          {j}
                        </option>
                      ))}
                    </select>
                  </div>

                  {activeTab === "tetap" && (
                    <div>
                      <label className="block text-xs font-semibold text-white mb-1">
                        Peminatan Divisi *
                      </label>
                      <select
                        value={divisi}
                        onChange={(e) => setDivisi(e.target.value as DivisiName)}
                        className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                      >
                        {DIVISI_OPTIONS.map((d) => (
                          <option key={d} value={d} className="bg-surface-2 text-white">
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* NISN & No WhatsApp */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      NISN (Opsional)
                    </label>
                    <input
                      type="text"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      placeholder="0081234567"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-white mb-1">
                      No. WhatsApp / HP
                    </label>
                    <input
                      type="text"
                      value={noHp}
                      onChange={(e) => setNoHp(e.target.value)}
                      placeholder="08123456789"
                      className="w-full px-3 py-2 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-studio-border-subtle">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-studio-text-secondary hover:text-white transition-colors min-h-[44px]"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan min-h-[44px]"
                  >
                    Simpan Anggota
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Tambah Pembina ─────────────────────────────────────────────── */}
      <TambahPembinaModal
        isOpen={isPembinaModalOpen}
        onClose={() => setIsPembinaModalOpen(false)}
      />
    </div>
  );
}
