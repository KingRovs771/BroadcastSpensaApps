"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useSession } from "@/components/shared/SessionContext";
import { UserRole, DivisiName } from "@/lib/mock/store";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Radio,
} from "lucide-react";

// ─── Spectrum bars animation ─────────────────────────────────────────────────
function SpectrumBars() {
  return (
    <span className="flex items-end gap-[3px] h-5 mb-0.5" aria-hidden="true">
      {[1.5, 3, 2, 2.5, 1, 3.5, 2].map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full animate-pulse"
          style={{
            height: `${h * 4}px`,
            animationDelay: `${i * 80}ms`,
            background: ["#F59E0B","#F97316","#22C55E","#06B6D4","#8B5CF6","#EC4899","#38BDF8"][i],
          }}
        />
      ))}
    </span>
  );
}

// ─── Background decorations ───────────────────────────────────────────────────
function PageBG() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[100px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-purple-900/10 blur-[80px]" />
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            width: `${2 + (i % 3)}px`,
            height: `${2 + (i % 3)}px`,
            top: `${10 + (i * 10) % 80}%`,
            left: `${5 + (i * 12) % 90}%`,
            background: ["#8B5CF6","#06B6D4","#EC4899","#F59E0B"][i % 4],
            opacity: 0.2 + (i % 3) * 0.1,
            animationDelay: `${i * 400}ms`,
            animationDuration: `${2 + (i % 3)}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { isLoggedIn, loginWithProfile } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  // ── Handle login ───────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError || !authData.user) {
        if (authError?.message.includes("Invalid login")) {
          setError("Email atau kata sandi salah. Silakan coba lagi.");
        } else if (authError?.message.includes("Email not confirmed")) {
          setError("Email belum diverifikasi. Periksa kotak masuk email Anda.");
        } else {
          setError(authError?.message ?? "Login gagal. Coba lagi.");
        }
        setIsLoading(false);
        return;
      }

      // 2. Fetch user profile from profiles table
      let profile: {
        id: string;
        nama: string;
        email: string;
        role: UserRole;
        divisi?: DivisiName;
        signature_url?: string;
      } | null = null;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, nama, email, role, divisi, signature_url")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileData) {
        profile = {
          id: profileData.id,
          nama: profileData.nama,
          email: profileData.email,
          role: profileData.role as UserRole,
          divisi: profileData.divisi as DivisiName | undefined,
          signature_url: profileData.signature_url ?? undefined,
        };
      } else {
        // Auto-provision profile jika baris belum dibuat di database
        const defaultName =
          (authData.user.user_metadata?.nama as string | undefined) ||
          authData.user.email?.split("@")[0] ||
          "Administrator";

        const { data: createdProfile } = await supabase
          .from("profiles")
          .upsert(
            {
              id: authData.user.id,
              nama: defaultName,
              email: authData.user.email!,
              role: "administrator",
            },
            { onConflict: "id" }
          )
          .select("id, nama, email, role, divisi, signature_url")
          .maybeSingle();

        if (createdProfile) {
          profile = {
            id: createdProfile.id,
            nama: createdProfile.nama,
            email: createdProfile.email,
            role: createdProfile.role as UserRole,
            divisi: createdProfile.divisi as DivisiName | undefined,
            signature_url: createdProfile.signature_url ?? undefined,
          };
        } else {
          // Fallback lokal agar user tidak pernah terkunci
          profile = {
            id: authData.user.id,
            nama: defaultName,
            email: authData.user.email!,
            role: "administrator" as UserRole,
          };
        }
      }

      // 3. Set profile in session context
      loginWithProfile(profile);

      // 4. Redirect — dashboard layout will show splash screen
      router.push("/");
    } catch (err: unknown) {
      console.error("Login error:", err);
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan jaringan. Periksa koneksi internet Anda.";
      setError(msg);
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] flex items-center justify-center p-4 overflow-hidden">
      <PageBG />

      <div
        className="relative z-10 w-full max-w-md transition-all duration-700"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0) scale(1)" : "translateY(28px) scale(0.97)",
        }}
      >
        <div className="bg-[#0B132B]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-600 via-cyan-400 to-pink-500" />

          <div className="p-8 sm:p-10 space-y-7">
            {/* ── Branding ── */}
            <div className="text-center flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-violet-500/25 blur-xl scale-[1.6]" />
                <div className="absolute inset-0 rounded-full border border-violet-400/20 scale-[1.25] animate-ping" style={{ animationDuration: "3s" }} />
                <div className="relative w-[88px] h-[88px] rounded-full bg-[#111C3B] border-2 border-violet-500/40 p-2 shadow-xl">
                  <Image
                    src="/logo/BC_DONE.png"
                    alt="Broadcast Spensa Logo"
                    width={80}
                    height={80}
                    className="rounded-full object-cover"
                    priority
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="font-['Cinzel',serif] font-bold text-xl tracking-[0.25em] text-white uppercase">
                    Broadcast Spensa
                  </h1>
                  <SpectrumBars />
                </div>
                <p className="text-[11px] font-mono tracking-[0.2em] text-slate-500 uppercase">
                  Operating System · v3.0.0
                </p>
                <p className="text-xs text-slate-600">SMP Negeri 1 Spensa</p>
              </div>
            </div>

            {/* ── Error banner ── */}
            {error && (
              <div
                className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* ── Login Form ── */}
            <form onSubmit={handleLogin} className="space-y-4" noValidate>
              <p className="text-[11px] font-mono font-semibold text-slate-500 tracking-widest uppercase flex items-center gap-2">
                <Radio className="w-3 h-3 text-violet-400" />
                Masuk dengan Akun Sekolah
              </p>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300">
                  Email
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-violet-400 pointer-events-none" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="nama@spensa.sch.id"
                    autoComplete="email"
                    disabled={isLoading}
                    aria-label="Email akun Broadcast Spensa"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#111C3B] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all min-h-[48px] disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300">
                  Kata Sandi
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-violet-400 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    disabled={isLoading}
                    aria-label="Kata sandi akun"
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-[#111C3B] border border-white/10 text-sm text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-none transition-all min-h-[48px] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                id="btn-login"
                type="submit"
                disabled={isLoading || !email || !password}
                aria-label="Masuk ke workspace Broadcast Spensa"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-violet-900/50 transition-all min-h-[52px] disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="text-center text-[10px] text-slate-700 leading-relaxed">
              Hanya anggota terdaftar Broadcast Spensa yang memiliki akses.<br />
              Hubungi <span className="text-slate-500">Administrator</span> untuk mendaftarkan akun.
            </p>
          </div>
        </div>

        <p className="text-center text-[10px] font-mono text-slate-800 mt-4 tracking-widest">
          BROADCAST SPENSA OS © 2026 · v3.0.0
        </p>
      </div>
    </div>
  );
}
