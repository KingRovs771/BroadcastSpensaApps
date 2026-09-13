"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSession } from "../shared/SessionContext";
import { getAcademicSemester } from "@/lib/utils/semester";
import {
  Wifi,
  WifiOff,
  Calendar,
  LogOut,
  Sparkles,
  User,
  Menu,
} from "lucide-react";

export function Topbar() {
  const router = useRouter();
  const {
    currentUser,
    isOffline,
    setIsOffline,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    logout,
  } = useSession();
  const semesterInfo = getAcademicSemester(new Date());

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-surface-1 border-b border-studio-border-subtle px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
      {/* Left: Mobile hamburger menu + Semester branding */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Buka Menu Navigasi"
          className="lg:hidden p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-slate-200 hover:text-white border border-studio-border-subtle transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5 text-spectrum-cyan" />
        </button>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs">
          <Calendar className="w-3.5 h-3.5 text-spectrum-cyan" />
          <span className="font-semibold text-white">{semesterInfo.label}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orbital-violet/10 border border-orbital-violet/20 text-[11px] font-mono text-orbital-magenta">
          <Sparkles className="w-3 h-3" />
          <span>Broadcast Spensa OS v3.0</span>
        </div>
      </div>

      {/* Right: User info + controls */}
      <div className="flex items-center gap-2.5">
        {/* Offline simulation toggle */}
        <button
          onClick={() => setIsOffline(!isOffline)}
          aria-label={isOffline ? "Beralih ke mode online" : "Simulasikan mode offline"}
          title="Klik untuk mensimulasikan mode studio offline"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border min-h-[44px] ${
            isOffline
              ? "bg-spectrum-amber/20 border-spectrum-amber text-spectrum-amber"
              : "bg-surface-2 border-studio-border-subtle text-studio-text-secondary hover:text-white"
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-spectrum-amber" />
              <span>Offline</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-spectrum-jade" />
              <span className="hidden sm:inline">Online</span>
            </>
          )}
        </button>

        {/* Current user pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-studio-border-subtle">
          <div className="w-6 h-6 rounded-full bg-orbital-violet/30 border border-orbital-violet/40 flex items-center justify-center">
            <User className="w-3 h-3 text-orbital-magenta" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-[11px] font-semibold text-white truncate max-w-[120px]">
              {currentUser.nama}
            </span>
            <span className="text-[9px] font-mono text-studio-text-muted uppercase tracking-wider">
              {currentUser.role.replace(/_/g, " ")}
              {currentUser.divisi ? ` · ${currentUser.divisi}` : ""}
            </span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          aria-label="Keluar dari workspace"
          title="Keluar"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all min-h-[44px]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </div>
    </header>
  );
}
