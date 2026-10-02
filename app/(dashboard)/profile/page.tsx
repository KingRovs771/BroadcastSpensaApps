"use client";

import React, { useState, useRef, useEffect } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { formatIDR } from "@/lib/utils/currency";
import {
  User,
  Shield,
  Key,
  Mail,
  GraduationCap,
  Award,
  Wallet,
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  PenTool,
  Clock,
  Sparkles,
  Layers,
  Lock,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfilePage() {
  const {
    currentUser,
    loginWithProfile,
    anggotaList,
    kasSettings,
    kasPembayaranList,
    absensiList,
    auditLogs,
    refreshData,
    logAction,
    supabase,
  } = useSession();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"info" | "security" | "keanggotaan" | "aktivitas">("info");

  // Edit Name State
  const [nama, setNama] = useState(currentUser.nama || "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Signature State
  const [signatureUrl, setSignatureUrl] = useState(currentUser.signature_url || "");
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [sigSuccess, setSigSuccess] = useState<string | null>(null);
  const [sigError, setSigError] = useState<string | null>(null);

  // Canvas Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Password Change State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    setNama(currentUser.nama || "");
    setSignatureUrl(currentUser.signature_url || "");
  }, [currentUser]);

  // Find linked AnggotaRecord if exists
  const linkedAnggota = anggotaList.find(
    (a) =>
      a.user_id === currentUser.id ||
      a.nama_lengkap.toLowerCase() === currentUser.nama.toLowerCase() ||
      (currentUser.email && a.nis && currentUser.email.startsWith(a.nis))
  );

  // Compute Kas details for linked anggota
  const memberKasList = linkedAnggota
    ? kasPembayaranList.filter((k) => k.anggota_id === linkedAnggota.id)
    : [];
  const paidWeeks = memberKasList.filter((k) => k.status === "lunas");
  const unpaidWeeks = memberKasList.filter((k) => k.status === "belum");
  const nominalTarif = kasSettings.nominal || 2000;
  const totalTunggakanNominal = unpaidWeeks.length * nominalTarif;

  // Compute Absensi details for linked anggota
  const memberAbsensiList = linkedAnggota
    ? absensiList.filter((a) => a.anggota_id === linkedAnggota.id && !a.is_libur)
    : [];
  const hadirCount = memberAbsensiList.filter((a) => a.status === "masuk").length;
  const izinCount = memberAbsensiList.filter((a) => a.status === "izin").length;
  const sakitCount = memberAbsensiList.filter((a) => a.status === "sakit").length;
  const alphaCount = memberAbsensiList.filter((a) => a.status === "alpha").length;
  const totalPertemuan = memberAbsensiList.length;
  const attendanceRate = totalPertemuan > 0 ? Math.round((hadirCount / totalPertemuan) * 100) : 100;

  // Audit Logs for this user
  const userLogs = auditLogs.filter(
    (l) => l.actor_id === currentUser.id || l.actor_name === currentUser.nama
  );

  // Handlers for Canvas Signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#38bdf8"; // Sky/Cyan
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureUrl(canvas.toDataURL("image/png"));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSignatureUrl("");
  };

  // Submit Name Update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setNameError(null);
    setNameSuccess(null);

    if (!nama.trim()) {
      setNameError("Nama tidak boleh kosong.");
      return;
    }

    setIsSavingName(true);
    try {
      if (currentUser.id && currentUser.id.length === 36) {
        const { error } = await supabase
          .from("profiles")
          .update({ nama: nama.trim() })
          .eq("id", currentUser.id);

        if (error) {
          throw new Error(error.message);
        }
      }

      loginWithProfile({
        ...currentUser,
        nama: nama.trim(),
      });

      await refreshData();
      logAction("UPDATE_SELF_PROFILE", "profiles", currentUser.id, `Memperbarui nama profil menjadi: ${nama.trim()}`);
      setNameSuccess("Nama profil berhasil diperbarui!");
    } catch (err: any) {
      console.error(err);
      setNameError(`Gagal memperbarui nama: ${err.message || err}`);
    } finally {
      setIsSavingName(false);
    }
  };

  // Submit Signature Update
  const handleSaveSignature = async () => {
    setSigError(null);
    setSigSuccess(null);

    setIsSavingSignature(true);
    try {
      if (currentUser.id && currentUser.id.length === 36) {
        const { error } = await supabase
          .from("profiles")
          .update({ signature_url: signatureUrl.trim() || null })
          .eq("id", currentUser.id);

        if (error) {
          throw new Error(error.message);
        }
      }

      loginWithProfile({
        ...currentUser,
        signature_url: signatureUrl.trim() || undefined,
      });

      await refreshData();
      logAction("UPDATE_SIGNATURE", "profiles", currentUser.id, `Memperbarui tanda tangan digital`);
      setSigSuccess("Tanda tangan digital berhasil disimpan!");
    } catch (err: any) {
      console.error(err);
      setSigError(`Gagal menyimpan tanda tangan: ${err.message || err}`);
    } finally {
      setIsSavingSignature(false);
    }
  };

  // Submit Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      setPasswordSuccess("Kata sandi berhasil diperbarui!");
      setNewPassword("");
      setConfirmPassword("");
      logAction("CHANGE_PASSWORD", "auth", currentUser.id, "Pengguna berhasil memperbarui kata sandi akunnya");
    } catch (err: any) {
      console.error(err);
      setPasswordError(`Gagal memperbarui kata sandi: ${err.message || err}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Profile Card */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-6 shadow-orbital relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-orbital-violet/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-spectrum-cyan/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orbital-violet/20 border-2 border-orbital-violet/40 flex items-center justify-center font-bold text-orbital-magenta text-2xl shadow-sm">
              {currentUser.nama.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  {currentUser.nama}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/30">
                  {currentUser.role.replace(/_/g, " ")}
                </span>
                {currentUser.divisi && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/30">
                    Divisi {currentUser.divisi}
                  </span>
                )}
              </div>
              <p className="text-xs text-studio-text-secondary mt-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-studio-text-muted" />
                <span>{currentUser.email}</span>
                <span className="text-studio-text-muted font-mono">• ID: {currentUser.id.slice(0, 8)}...</span>
              </p>
            </div>
          </div>

          {linkedAnggota && (
            <div className="flex items-center gap-3 p-3 bg-surface-2/80 rounded-xl border border-studio-border-subtle text-xs font-mono">
              <GraduationCap className="w-5 h-5 text-spectrum-cyan" />
              <div>
                <p className="font-bold text-white">Siswa Terdaftar (Spensa)</p>
                <p className="text-studio-text-muted text-[11px]">
                  NIS: {linkedAnggota.nis} • Kelas: {linkedAnggota.kelas} ({linkedAnggota.tipe.toUpperCase()})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-studio-border-subtle pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("info")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] whitespace-nowrap ${
            activeTab === "info"
              ? "bg-spectrum-cobalt text-ink shadow-cyan"
              : "text-studio-text-secondary hover:text-white hover:bg-surface-2"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Informasi Akun</span>
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] whitespace-nowrap ${
            activeTab === "security"
              ? "bg-spectrum-cobalt text-ink shadow-cyan"
              : "text-studio-text-secondary hover:text-white hover:bg-surface-2"
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Keamanan &amp; Kata Sandi</span>
        </button>

        <button
          onClick={() => setActiveTab("keanggotaan")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] whitespace-nowrap ${
            activeTab === "keanggotaan"
              ? "bg-spectrum-cobalt text-ink shadow-cyan"
              : "text-studio-text-secondary hover:text-white hover:bg-surface-2"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Status Keanggotaan &amp; Kas/Absensi</span>
        </button>

        <button
          onClick={() => setActiveTab("aktivitas")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all min-h-[40px] whitespace-nowrap ${
            activeTab === "aktivitas"
              ? "bg-spectrum-cobalt text-ink shadow-cyan"
              : "text-studio-text-secondary hover:text-white hover:bg-surface-2"
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Riwayat Aktivitas</span>
        </button>
      </div>

      {/* TAB CONTENT */}
      {/* 1. INFORMASI AKUN & TANDA TANGAN */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edit Nama & Biodata */}
          <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-spectrum-cyan" />
              Biodata Akun Pengguna
            </h3>
            <p className="text-xs text-studio-text-secondary">
              Perbarui nama tampilan akun Anda. Peran dan divisi ditetapkan oleh Administrator / Pembina.
            </p>

            {nameSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-spectrum-jade/10 border border-spectrum-jade/20 text-spectrum-jade text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{nameSuccess}</span>
              </div>
            )}

            {nameError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-spectrum-crimson/10 border border-spectrum-crimson/20 text-spectrum-crimson text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{nameError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label htmlFor="profile-nama" className="block text-xs font-mono text-studio-text-secondary mb-1">
                  Nama Lengkap
                </label>
                <input
                  id="profile-nama"
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-surface-2 border border-studio-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-spectrum-cyan min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-studio-text-secondary mb-1">
                  Alamat Email (Akun Login)
                </label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-surface-2/60 border border-studio-border-subtle/60 rounded-xl px-3.5 py-2.5 text-xs text-studio-text-muted cursor-not-allowed min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-studio-text-secondary mb-1">
                    Peran Sistem (Role)
                  </label>
                  <div className="p-2.5 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white font-mono uppercase">
                    {currentUser.role.replace(/_/g, " ")}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-studio-text-secondary mb-1">
                    Divisi
                  </label>
                  <div className="p-2.5 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white font-mono">
                    {currentUser.divisi || "Umum"}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingName}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink text-xs font-bold transition-all shadow-cyan disabled:opacity-50 min-h-[44px]"
              >
                {isSavingName ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Nama</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Tanda Tangan Digital */}
          <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PenTool className="w-4 h-4 text-orbital-magenta" />
              Tanda Tangan Digital
            </h3>
            <p className="text-xs text-studio-text-secondary">
              Tanda tangan digital digunakan untuk validasi laporan, risalah notulen rapat, dan persetujuan naskah.
            </p>

            {sigSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-spectrum-jade/10 border border-spectrum-jade/20 text-spectrum-jade text-xs font-mono">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sigSuccess}</span>
              </div>
            )}

            {sigError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-spectrum-crimson/10 border border-spectrum-crimson/20 text-spectrum-crimson text-xs font-mono">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sigError}</span>
              </div>
            )}

            {/* Canvas Gambar Tanda Tangan */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-studio-text-secondary mb-1.5">
                <span>Goreskan Tanda Tangan:</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] text-spectrum-crimson hover:underline"
                >
                  Bersihkan Canvas
                </button>
              </div>

              <div className="border border-studio-border-medium rounded-xl overflow-hidden bg-surface-2 touch-none">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[140px] cursor-crosshair block"
                />
              </div>
            </div>

            {/* Input URL atau Pratinjau Tanda Tangan */}
            {signatureUrl && (
              <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle space-y-2">
                <span className="text-[11px] font-mono text-studio-text-muted">Pratinjau Tanda Tangan:</span>
                <div className="h-16 flex items-center justify-center p-2 bg-surface-1 rounded-lg border border-studio-border-subtle">
                  <img src={signatureUrl} alt="Tanda Tangan" className="max-h-full object-contain filter invert" />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveSignature}
              disabled={isSavingSignature}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orbital-violet/20 hover:bg-orbital-violet/30 border border-orbital-violet/40 text-orbital-magenta text-xs font-bold transition-all disabled:opacity-50 min-h-[44px]"
            >
              {isSavingSignature ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan Tanda Tangan...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Simpan Tanda Tangan Digital</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 2. KEAMANAN & KATA SANDI */}
      {activeTab === "security" && (
        <div className="max-w-xl bg-surface-1 border border-studio-border-subtle rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-spectrum-amber" />
            Perbarui Kata Sandi Akun
          </h3>
          <p className="text-xs text-studio-text-secondary">
            Ubah kata sandi login Anda untuk memastikan keamanan akses workspace Broadcast Spensa OS.
          </p>

          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-spectrum-jade/10 border border-spectrum-jade/20 text-spectrum-jade text-xs font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-spectrum-crimson/10 border border-spectrum-crimson/20 text-spectrum-crimson text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="new-pass" className="block text-xs font-mono text-studio-text-secondary mb-1">
                Kata Sandi Baru (Min. 6 Karakter) *
              </label>
              <input
                id="new-pass"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-2 border border-studio-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-spectrum-cyan min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="confirm-pass" className="block text-xs font-mono text-studio-text-secondary mb-1">
                Konfirmasi Kata Sandi Baru *
              </label>
              <input
                id="confirm-pass"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-2 border border-studio-border-subtle rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-spectrum-cyan min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-spectrum-amber hover:bg-amber-400 text-ink text-xs font-bold transition-all shadow-amber disabled:opacity-50 min-h-[44px]"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memperbarui Sandi...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4" />
                  <span>Perbarui Kata Sandi</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* 3. STATUS KEANGGOTAAN, KAS, & ABSENSI PRIBADI */}
      {activeTab === "keanggotaan" && (
        <div className="space-y-6">
          {linkedAnggota ? (
            <>
              {/* Member Overview Card */}
              <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] font-mono text-studio-text-muted uppercase">Nomor Induk (NIS)</span>
                  <p className="text-sm font-bold font-mono text-white mt-0.5">{linkedAnggota.nis}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-studio-text-muted uppercase">Kelas &amp; Tipe</span>
                  <p className="text-sm font-bold font-mono text-white mt-0.5">{linkedAnggota.kelas} ({linkedAnggota.tipe.toUpperCase()})</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-studio-text-muted uppercase">Divisi Siswa</span>
                  <p className="text-sm font-bold text-spectrum-cyan mt-0.5">{linkedAnggota.divisi}</p>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-studio-text-muted uppercase">Jabatan</span>
                  <p className="text-sm font-bold text-orbital-magenta mt-0.5">{linkedAnggota.jabatan}</p>
                </div>
              </div>

              {/* Status Iuran Kas & Rekap Absensi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KAS PRIBADI */}
                <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-spectrum-jade" />
                      Status Iuran Kas Anda
                    </h3>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        unpaidWeeks.length === 0
                          ? "bg-spectrum-jade/20 text-spectrum-jade border border-spectrum-jade/30"
                          : "bg-spectrum-crimson/20 text-spectrum-crimson border border-spectrum-crimson/30"
                      }`}
                    >
                      {unpaidWeeks.length === 0
                        ? "LUNAS TUNTAS"
                        : `TUNGGAKAN ${unpaidWeeks.length} ${
                            kasSettings.periode_type === "bulanan"
                              ? "BULAN"
                              : kasSettings.periode_type === "dwimingguan"
                              ? "PERIODE"
                              : "PEKAN"
                          }`}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle text-center">
                      <span className="text-[10px] font-mono text-studio-text-muted block">
                        {kasSettings.periode_type === "bulanan"
                          ? "Tarif Bulanan"
                          : kasSettings.periode_type === "dwimingguan"
                          ? "Tarif Dwimingguan"
                          : "Tarif Mingguan"}
                      </span>
                      <span className="text-xs font-bold font-mono text-white">{formatIDR(nominalTarif)}</span>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle text-center">
                      <span className="text-[10px] font-mono text-studio-text-muted block">
                        {kasSettings.periode_type === "bulanan" ? "Bulan Lunas" : "Pekan Lunas"}
                      </span>
                      <span className="text-xs font-bold font-mono text-spectrum-jade">
                        {paidWeeks.length} {kasSettings.periode_type === "bulanan" ? "Bulan" : "Pekan"}
                      </span>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle text-center">
                      <span className="text-[10px] font-mono text-studio-text-muted block">Tunggakan</span>
                      <span className="text-xs font-bold font-mono text-spectrum-crimson">{formatIDR(totalTunggakanNominal)}</span>
                    </div>
                  </div>

                  {/* List Minggu Kas */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-mono text-studio-text-secondary block">
                      Rincian Minggu Berjalan:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {memberKasList.length === 0 ? (
                        <p className="text-xs font-mono text-studio-text-muted py-3 text-center">
                          Belum ada periode kas terbit
                        </p>
                      ) : (
                        memberKasList.map((k) => (
                          <div
                            key={k.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs font-mono"
                          >
                            <span>{k.periode_label}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                k.status === "lunas"
                                  ? "bg-spectrum-jade/10 text-spectrum-jade border border-spectrum-jade/20"
                                  : "bg-spectrum-crimson/10 text-spectrum-crimson border border-spectrum-crimson/20"
                              }`}
                            >
                              {k.status === "lunas" ? "✓ LUNAS" : "BELUM BAYAR"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* ABSENSI PRIBADI */}
                <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-spectrum-cyan" />
                      Rekap Kehadiran Mingguan Anda
                    </h3>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/30">
                      Tingkat Kehadiran: {attendanceRate}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle">
                      <span className="text-[10px] font-mono text-studio-text-muted block">Hadir</span>
                      <span className="text-sm font-bold font-mono text-spectrum-jade">{hadirCount}</span>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle">
                      <span className="text-[10px] font-mono text-studio-text-muted block">Izin</span>
                      <span className="text-sm font-bold font-mono text-spectrum-gold">{izinCount}</span>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle">
                      <span className="text-[10px] font-mono text-studio-text-muted block">Sakit</span>
                      <span className="text-sm font-bold font-mono text-spectrum-cobalt">{sakitCount}</span>
                    </div>
                    <div className="p-3 bg-surface-2 rounded-xl border border-studio-border-subtle">
                      <span className="text-[10px] font-mono text-studio-text-muted block">Alpha</span>
                      <span className="text-sm font-bold font-mono text-spectrum-crimson">{alphaCount}</span>
                    </div>
                  </div>

                  {/* List Riwayat Absensi */}
                  <div className="space-y-1.5 pt-2">
                    <span className="text-xs font-mono text-studio-text-secondary block">
                      Riwayat Presensi Pertemuan Terakhir:
                    </span>
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                      {memberAbsensiList.length === 0 ? (
                        <p className="text-xs font-mono text-studio-text-muted py-3 text-center">
                          Belum ada catatan presensi
                        </p>
                      ) : (
                        memberAbsensiList.map((a) => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs font-mono"
                          >
                            <span>Pertemuan {a.tanggal}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                                a.status === "masuk"
                                  ? "bg-spectrum-jade/10 text-spectrum-jade border border-spectrum-jade/20"
                                  : a.status === "izin"
                                  ? "bg-spectrum-gold/10 text-spectrum-gold border border-spectrum-gold/20"
                                  : a.status === "sakit"
                                  ? "bg-spectrum-cobalt/10 text-spectrum-cobalt border border-spectrum-cobalt/20"
                                  : "bg-spectrum-crimson/10 text-spectrum-crimson border border-spectrum-crimson/20"
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center bg-surface-1 border border-studio-border-subtle rounded-2xl space-y-2">
              <Shield className="w-8 h-8 text-spectrum-cyan mx-auto" />
              <h4 className="text-sm font-bold text-white">Akun Operasional / Pembina / Admin</h4>
              <p className="text-xs text-studio-text-secondary max-w-md mx-auto">
                Akun ini bertindak sebagai {currentUser.role.replace(/_/g, " ")}. Data iuran kas dan absensi mingguan khusus diperuntukkan bagi akun siswa (Anggota Tetap / Ekskul).
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. RIWAYAT AKTIVITAS (AUDIT LOG) */}
      {activeTab === "aktivitas" && (
        <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-spectrum-cyan" />
            Catatan Aktivitas Akun Anda
          </h3>
          <p className="text-xs text-studio-text-secondary">
            Rekam jejak tindakan dan mutasi yang pernah dilakukan oleh akun ini di dalam sistem.
          </p>

          <div className="space-y-2">
            {userLogs.length === 0 ? (
              <div className="p-8 text-center text-xs font-mono text-studio-text-muted border border-dashed border-studio-border-subtle rounded-xl">
                Belum ada aktivitas tercatat untuk akun ini.
              </div>
            ) : (
              userLogs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-surface-2 border border-studio-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-spectrum-cyan uppercase">{log.action}</span>
                    <p className="text-[11px] text-studio-text-secondary">{log.details || `Aksi pada ${log.target_table}`}</p>
                  </div>
                  <span className="text-[10px] text-studio-text-muted shrink-0">
                    {new Date(log.timestamp).toLocaleString("id-ID")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
