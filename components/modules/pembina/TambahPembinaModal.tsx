"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/shared/SessionContext";
import { UserProfile, UserRole, DivisiName, AnggotaRecord } from "@/lib/mock/store";
import { DIVISI_OPTIONS } from "@/lib/validations/produksi";
import { getAcademicSemester } from "@/lib/utils/semester";
import {
  X,
  UserCheck,
  Mail,
  Lock,
  Phone,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  GraduationCap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TambahPembinaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newPembina: UserProfile) => void;
}

const TINGKAT_KELAS_OPTIONS = ["VII", "VIII", "IX"] as const;
const ROMBEL_OPTIONS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"
] as const;

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: "pembina", label: "Dewan Pembina", desc: "Supervisi, Approval Gate 1 & Anggaran" },
  { value: "administrator", label: "Administrator", desc: "Akses penuh konfigurasi sistem" },
  { value: "ketua_broadcast", label: "Ketua Umum Broadcast", desc: "Approval Gate 2 & Operasional" },
  { value: "ketua_divisi", label: "Ketua Divisi", desc: "Approval Gate 2 Produksi Divisi" },
  { value: "sekretaris", label: "Sekretaris", desc: "Kelola data anggota, notulen & absensi" },
  { value: "bendahara", label: "Bendahara", desc: "Kelola kas anggota & pencatatan iuran" },
  { value: "div_kreatif", label: "Divisi Kreatif", desc: "Pembuatan naskah & script produksi" },
  { value: "pj", label: "Penanggung Jawab (PJ)", desc: "Submit link & kelola project produksi" },
  { value: "anggota", label: "Anggota Biasa", desc: "Akses viewer materi & jadwal" },
];

export function TambahPembinaModal({
  isOpen,
  onClose,
  onSuccess,
}: TambahPembinaModalProps) {
  const supabase = createClient();
  const { logAction, refreshData, setPembinaList, setAllUsers, setAnggotaList } = useSession();

  const [nama, setNama] = useState("");
  const [nip, setNip] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("pembina");
  const [divisi, setDivisi] = useState<DivisiName>("Broadcasting");
  const [jabatanSekolah, setJabatanSekolah] = useState("Guru Pembina Ekskul");
  const [noHp, setNoHp] = useState("");

  // Opsi Tambah Sekaligus sebagai Anggota Tetap
  const [daftarSebagaiAnggotaTetap, setDaftarSebagaiAnggotaTetap] = useState(false);
  const [tingkatKelas, setTingkatKelas] = useState<"VII" | "VIII" | "IX">("VIII");
  const [rombelKelas, setRombelKelas] = useState<string>("A");
  const [nisn, setNisn] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!nama.trim() || !email.trim() || !password) {
      setErrorMsg("Nama lengkap, email, dan kata sandi wajib diisi.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    setIsLoading(true);

    try {
      let userId = `usr-${Date.now()}`;

      // 1. Coba buat akun melalui API Admin (langsung terverifikasi tanpa kirim email)
      try {
        const createRes = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim().toLowerCase(),
            password,
            nama: nama.trim(),
            role: selectedRole,
            nip: nip.trim() || undefined,
            jabatan: jabatanSekolah.trim(),
            no_hp: noHp.trim() || undefined,
            divisi: selectedRole === "div_kreatif" || selectedRole === "ketua_divisi" || selectedRole === "pj" ? divisi : undefined,
          }),
        });

        const createData = await createRes.json();

        if (!createRes.ok && createRes.status === 409) {
          setErrorMsg("Email ini sudah terdaftar di sistem. Gunakan email lain.");
          setIsLoading(false);
          return;
        }

        if (createRes.ok && createData.user?.id) {
          userId = createData.user.id;
        } else {
          // Fallback ke Supabase Auth Client jika endpoint admin tidak merespons
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
            password,
            options: {
              data: {
                nama: nama.trim(),
                role: selectedRole,
                nip: nip.trim() || undefined,
                jabatan: jabatanSekolah.trim(),
                no_hp: noHp.trim() || undefined,
                divisi: selectedRole === "div_kreatif" || selectedRole === "ketua_divisi" || selectedRole === "pj" ? divisi : undefined,
              },
            },
          });

          if (authError && authError.message.includes("User already registered")) {
            setErrorMsg("Email ini sudah terdaftar di sistem. Gunakan email lain.");
            setIsLoading(false);
            return;
          }

          if (authData?.user?.id) {
            userId = authData.user.id;
          }
        }
      } catch (err) {
        console.warn("API create user exception, continuing with profile creation:", err);
      }

      // 2. Simpan atau pastikan profil ada di public.profiles
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          nama: nama.trim(),
          email: email.trim().toLowerCase(),
          role: selectedRole,
          divisi: (selectedRole === "div_kreatif" || selectedRole === "ketua_divisi" || selectedRole === "pj") ? divisi : null,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        console.warn("Profil auto-insert notice:", profileError);
      }

      const newProfile: UserProfile = {
        id: userId,
        nama: nama.trim(),
        email: email.trim().toLowerCase(),
        role: selectedRole,
        divisi: (selectedRole === "div_kreatif" || selectedRole === "ketua_divisi" || selectedRole === "pj") ? divisi : undefined,
      };

      // 3. Update local session context state immediately
      setAllUsers((prev: UserProfile[]) => {
        const exists = prev.some((p: UserProfile) => p.id === userId || p.email === newProfile.email);
        if (exists) return prev.map((p: UserProfile) => (p.email === newProfile.email ? newProfile : p));
        return [newProfile, ...prev];
      });

      if (selectedRole === "pembina" || selectedRole === "administrator") {
        setPembinaList((prev: UserProfile[]) => {
          const exists = prev.some((p: UserProfile) => p.id === userId || p.email === newProfile.email);
          if (exists) return prev.map((p: UserProfile) => (p.email === newProfile.email ? newProfile : p));
          return [newProfile, ...prev];
        });
      }

      // 4. DAFTARKAN SEKALIGUS KE BUKU INDUK ANGGOTA TETAP (Jika opsi aktif)
      let autoKelas = "";
      if (daftarSebagaiAnggotaTetap) {
        autoKelas = `${tingkatKelas}-${rombelKelas}`;
        const finalNis = nip.trim() || `26${Math.floor(1000 + Math.random() * 9000)}`;
        const currentAcademic = getAcademicSemester(new Date());

        const newAnggotaRecord: AnggotaRecord = {
          id: `ang-${Date.now()}`,
          tipe: "tetap",
          nama_lengkap: nama.trim(),
          nis: finalNis,
          nisn: nisn.trim() || undefined,
          kelas: autoKelas,
          jabatan: jabatanSekolah.trim() || selectedRole.replace(/_/g, " "),
          divisi: (selectedRole === "div_kreatif" || selectedRole === "ketua_divisi" || selectedRole === "pj") ? divisi : undefined,
          tahun_ajaran: currentAcademic.tahunAjaran,
          status: "aktif",
          no_hp: noHp.trim() || undefined,
        };

        // Insert ke tabel Supabase public.anggota
        const { error: anggotaErr } = await supabase.from("anggota").insert({
          tipe: "tetap",
          nama_lengkap: newAnggotaRecord.nama_lengkap,
          nis: newAnggotaRecord.nis,
          nisn: newAnggotaRecord.nisn || null,
          kelas: newAnggotaRecord.kelas,
          jabatan: newAnggotaRecord.jabatan,
          divisi: newAnggotaRecord.divisi || null,
          tahun_ajaran: newAnggotaRecord.tahun_ajaran,
          status: newAnggotaRecord.status,
          no_hp: newAnggotaRecord.no_hp || null,
        });

        if (anggotaErr) {
          console.warn("Anggota insert notice:", anggotaErr);
        }

        // Update state anggotaList
        setAnggotaList((prev: AnggotaRecord[]) => [newAnggotaRecord, ...prev]);

        logAction(
          "REGISTER_ANGGOTA_TETAP_AUTO",
          "anggota",
          newAnggotaRecord.id,
          `Auto-registrasi Anggota Tetap via Akun: ${nama.trim()} (${autoKelas})`
        );
      }

      // 5. Catat audit log untuk pendaftaran akun
      logAction(
        "REGISTER_USER",
        "profiles",
        userId,
        `Menambahkan Akun: ${nama.trim()} (${selectedRole.toUpperCase()})`
      );

      if (onSuccess) {
        onSuccess(newProfile);
      }

      try {
        await refreshData();
      } catch (err) {
        console.warn("Refresh notice:", err);
      }

      let notif = `Berhasil mendaftarkan akun ${nama} (${selectedRole.toUpperCase()})! Akun langsung aktif tanpa perlu verifikasi email.`;
      if (daftarSebagaiAnggotaTetap) {
        notif += ` Sekaligus resmi tercatat sebagai Anggota Tetap Kelas ${autoKelas} di Buku Induk!`;
      }

      setSuccessMsg(notif);

      // Reset form
      setNama("");
      setNip("");
      setEmail("");
      setPassword("");
      setNoHp("");

      setTimeout(() => {
        setIsLoading(false);
        onClose();
      }, 1600);
    } catch (err: unknown) {
      console.error("Error creating user:", err);
      const msg = err instanceof Error ? err.message : "Gagal menambahkan akun pengguna.";
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative bg-[#0B132B] border border-violet-500/30 rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
        >
          {/* Top accent border */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-600 via-pink-500 to-cyan-400" />

          {/* Modal Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide">
                  Tambah Akun Pengguna / Pembina
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Broadcast Spensa OS · Akses Monitoring, Produksi & Approval
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body content */}
          <div className="overflow-y-auto pr-1 mt-4 space-y-4 flex-1">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form id="form-tambah-pembina" onSubmit={handleSubmit} className="space-y-4">
              {/* Pilihan Role / Hak Akses */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Peran & Hak Akses Akun (Role) *
                </label>
                <div className="relative group">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                  <select
                    value={selectedRole}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setSelectedRole(newRole);
                      if (newRole === "pembina") {
                        setJabatanSekolah("Guru Pembina Ekskul");
                        setDaftarSebagaiAnggotaTetap(false);
                      } else if (newRole === "administrator") {
                        setJabatanSekolah("Administrator Sistem");
                        setDaftarSebagaiAnggotaTetap(true);
                      } else if (newRole === "ketua_broadcast") {
                        setJabatanSekolah("Ketua Umum Broadcast");
                        setDaftarSebagaiAnggotaTetap(true);
                      } else if (newRole === "sekretaris") {
                        setJabatanSekolah("Sekretaris");
                        setDaftarSebagaiAnggotaTetap(true);
                      } else if (newRole === "bendahara") {
                        setJabatanSekolah("Bendahara");
                        setDaftarSebagaiAnggotaTetap(true);
                      } else if (newRole === "div_kreatif") {
                        setJabatanSekolah("Staf Divisi Kreatif");
                        setDaftarSebagaiAnggotaTetap(true);
                      } else if (newRole === "pj") {
                        setJabatanSekolah("Penanggung Jawab Project");
                        setDaftarSebagaiAnggotaTetap(true);
                      } else {
                        setJabatanSekolah("Anggota");
                        setDaftarSebagaiAnggotaTetap(true);
                      }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-[#0B132B] text-white">
                        {opt.label} — {opt.desc}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Divisi (jika peran terkait divisi) */}
              {(selectedRole === "ketua_divisi" || selectedRole === "div_kreatif" || selectedRole === "pj") && (
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Divisi Terkait *
                  </label>
                  <select
                    value={divisi}
                    onChange={(e) => setDivisi(e.target.value as DivisiName)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  >
                    {DIVISI_OPTIONS.map((div) => (
                      <option key={div} value={div} className="bg-[#0B132B] text-white">
                        Divisi {div}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Nama Lengkap {selectedRole === "pembina" ? "& Gelar Pembina" : "Pengguna"} *
                </label>
                <div className="relative group">
                  <UserCheck className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder={selectedRole === "pembina" ? "Contoh: Dra. Hj. Siti Rahmah, M.Pd" : "Nama lengkap pengguna"}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* NIP / NIS & Jabatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    NIP / NUPTK / NIS (Opsional)
                  </label>
                  <input
                    type="text"
                    value={nip}
                    onChange={(e) => setNip(e.target.value)}
                    placeholder={selectedRole === "pembina" ? "197804122005012008" : "Nomor Induk Siswa"}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Jabatan Struktural / Guru *
                  </label>
                  <div className="relative group">
                    <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                    <input
                      type="text"
                      required
                      value={jabatanSekolah}
                      onChange={(e) => setJabatanSekolah(e.target.value)}
                      placeholder="Contoh: Guru Pembina Utama"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Email Akun Login *
                  </label>
                  <div className="relative group">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@spensa.sch.id"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                    Kata Sandi Awal *
                  </label>
                  <div className="relative group">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* No. WhatsApp */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  No. WhatsApp / HP (Opsional)
                </label>
                <div className="relative group">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none group-focus-within:text-violet-400" />
                  <input
                    type="text"
                    value={noHp}
                    onChange={(e) => setNoHp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#111C3B] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 focus:outline-none min-h-[44px]"
                  />
                </div>
              </div>

              {/* Opsi Daftarkan Sekaligus sebagai Anggota Tetap */}
              <div className="p-4 rounded-2xl bg-[#0e1736] border border-cyan-500/30 space-y-3 shadow-lg shadow-cyan-950/20">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={daftarSebagaiAnggotaTetap}
                    onChange={(e) => setDaftarSebagaiAnggotaTetap(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded text-spectrum-cyan border-white/20 bg-[#111C3B] focus:ring-spectrum-cyan/30 focus:ring-offset-0 cursor-pointer accent-cyan-500"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-spectrum-cyan" />
                      Daftarkan Sekaligus ke Buku Induk Anggota Tetap
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      Akun pengguna ini akan otomatis terdaftar sebagai <strong>Anggota Tetap</strong> di direktori Buku Induk sehingga tidak perlu 2x mengisi data.
                    </p>
                  </div>
                </label>

                {daftarSebagaiAnggotaTetap && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-white/10">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Kelas Siswa *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={tingkatKelas}
                          onChange={(e) => setTingkatKelas(e.target.value as "VII" | "VIII" | "IX")}
                          className="w-full px-2.5 py-2 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
                        >
                          {TINGKAT_KELAS_OPTIONS.map((t) => (
                            <option key={t} value={t} className="bg-[#0B132B]">
                              Kelas {t}
                            </option>
                          ))}
                        </select>
                        <select
                          value={rombelKelas}
                          onChange={(e) => setRombelKelas(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-xl bg-[#111C3B] border border-white/10 text-xs text-white focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
                        >
                          {ROMBEL_OPTIONS.map((r) => (
                            <option key={r} value={r} className="bg-[#0B132B]">
                              Ruang {r}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        NISN Siswa (Opsional)
                      </label>
                      <input
                        type="text"
                        value={nisn}
                        onChange={(e) => setNisn(e.target.value)}
                        placeholder="Contoh: 0081234567"
                        className="w-full px-3 py-2 rounded-xl bg-[#111C3B] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:border-spectrum-cyan focus:outline-none min-h-[40px]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-violet-950/40 border border-violet-800/30 text-[11px] text-slate-400 leading-relaxed">
                ℹ️ <strong className="text-violet-300">Deskripsi Hak Akses:</strong> {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.desc}. Akun ini dapat langsung melihat dan mengelola data sesuai perannya.
              </div>
            </form>
          </div>

          {/* Footer Action */}
          <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              form="form-tambah-pembina"
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-violet-900/40 transition-all flex items-center gap-2 min-h-[44px] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4" />
                  <span>Daftarkan {ROLE_OPTIONS.find((r) => r.value === selectedRole)?.label || "Akun"}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
