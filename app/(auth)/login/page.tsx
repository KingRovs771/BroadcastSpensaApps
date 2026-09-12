"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { SpectrumLogo } from "@/components/layout/SpectrumLogo";
import { useSession } from "@/components/shared/SessionContext";
import { Lock, Mail, ArrowRight, Sparkles, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { availableUsers, switchUser } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDemoUser, setSelectedDemoUser] = useState(availableUsers[1]?.id || "");

  const handleDemoLogin = () => {
    switchUser(selectedDemoUser);
    router.push("/");
  };

  const handleEmailLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to home with active session
    router.push("/");
  };

  return (
    <div className="w-full max-w-md bg-surface-1 border border-studio-border-subtle rounded-3xl p-8 shadow-orbital relative overflow-hidden space-y-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-orbital-violet/10 rounded-full blur-3xl pointer-events-none" />

      {/* Branding */}
      <div className="text-center flex flex-col items-center">
        <SpectrumLogo size="lg" showText={false} />
        <h1 className="font-brand font-bold text-xl tracking-[0.2em] text-white mt-3 uppercase">
          BROADCAST SPENSA OS
        </h1>
        <p className="text-xs font-mono text-studio-text-secondary mt-1">
          SMP NEGERI 1 SPENSA · VERSION 3.0.0
        </p>
      </div>

      {/* Quick Role Switcher Demo Gateway */}
      <div className="p-4 rounded-2xl bg-surface-2 border border-studio-border-medium space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono font-bold text-orbital-magenta">
          <UserCheck className="w-4 h-4" />
          <span>INSTANT DEMO GATEWAY (9 ROLES)</span>
        </div>

        <select
          value={selectedDemoUser}
          onChange={(e) => setSelectedDemoUser(e.target.value)}
          aria-label="Pilih akun peran demo"
          className="w-full px-3 py-2.5 rounded-xl bg-surface-1 border border-studio-border-subtle text-xs text-white focus:border-orbital-violet focus:outline-none cursor-pointer min-h-[44px]"
        >
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nama} — {u.role.replace("_", " ").toUpperCase()} {u.divisi ? `(${u.divisi})` : ""}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={handleDemoLogin}
          aria-label="Masuk langsung dengan peran demo"
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-orbital-violet to-spectrum-cobalt hover:opacity-90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-orbital transition-all min-h-[44px]"
        >
          <span>Masuk Langsung Sebagai Demo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 text-studio-text-muted text-[11px] font-mono">
        <div className="flex-1 h-px bg-studio-border-subtle" />
        <span>ATAU KREDENSIAL SEKOLAH</span>
        <div className="flex-1 h-px bg-studio-border-subtle" />
      </div>

      {/* Supabase Email/Password Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="block text-xs font-semibold text-white mb-1">
            Email Sekolah Spensa
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@spensa.sch.id"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-xs font-semibold text-white mb-1">
            Kata Sandi
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-studio-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-2 border border-studio-border-subtle text-xs text-white placeholder:text-studio-text-muted focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 px-4 rounded-xl bg-spectrum-cobalt hover:bg-sky-400 text-ink font-bold text-xs transition-colors min-h-[44px]"
        >
          Masuk Workspace
        </button>
      </form>
    </div>
  );
}
