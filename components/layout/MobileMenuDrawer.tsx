"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { SpectrumLogo } from "./SpectrumLogo";
import { useSession } from "../shared/SessionContext";
import { cn } from "@/lib/utils/cn";
import { ALL_NAV_ITEMS, isRouteAllowedForUser } from "@/lib/utils/nav-permissions";
import {
  X,
  LayoutDashboard,
  Video,
  Wallet,
  CalendarCheck,
  Kanban,
  FileText,
  Lock,
  Camera,
  Archive,
  Users,
  Printer,
  ShieldCheck,
  Wifi,
  WifiOff,
  LogOut,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export function MobileMenuDrawer() {
  const pathname = usePathname();
  const {
    currentUser,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isOffline,
    setIsOffline,
    logout,
  } = useSession();

  // Close drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname, setIsMobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isPrivilegedKeuangan = [
    "pembina",
    "ketua_broadcast",
    "bendahara",
    "administrator",
  ].includes(currentUser.role);

  const rawNavItems = [
    {
      label: currentUser.role === "pembina" ? "Monitoring Pembina" : "Dashboard Utama",
      href: currentUser.role === "pembina" ? "/pembina" : "/",
      icon: LayoutDashboard,
      desc: "Ringkasan metrik & status operasional",
      badge: currentUser.role === "pembina" ? "PEMBINA" : undefined,
    },
    {
      label: "Produksi Dual-Gate",
      href: "/produksi",
      icon: Video,
      desc: "Kurasi naskah video & podcast",
      badge: "GATE",
    },
    {
      label: "Buku Kas Anggota",
      href: "/kas",
      icon: Wallet,
      desc: "Pencatatan iuran mingguan & tunggakan",
    },
    {
      label: "Absensi Mingguan",
      href: "/absensi",
      icon: CalendarCheck,
      desc: "Presensi siswa Tetap & Ekskul",
    },
    {
      label: "Project Kanban",
      href: "/project",
      icon: Kanban,
      desc: "Manajemen alur kerja & tugas tim",
    },
    {
      label: "Notulen Rapat",
      href: "/notulen",
      icon: FileText,
      desc: "Editor risalah & arsip rapat",
    },
    {
      label: "Keuangan Pembina",
      href: "/keuangan-pembina",
      icon: Lock,
      desc: "Buku kas strategis dana BOS & Sponsor",
      badge: "KHUSUS",
    },
    {
      label: "Agenda Foto / Lomba",
      href: "/agenda-foto",
      icon: Camera,
      desc: "Rekor kejuaraan & dokumentasi lomba",
    },
    {
      label: "Inventaris Aset",
      href: "/inventaris",
      icon: Archive,
      desc: "Peminjaman & sirkulasi alat studio",
    },
    {
      label: "Data Anggota (Buku Induk)",
      href: "/anggota",
      icon: Users,
      desc: "Direktori siswa & akun pengurus",
    },
    {
      label: "Laporan Semester",
      href: "/laporan",
      icon: Printer,
      desc: "Generator dokumen & format cetak resmi",
    },
  ];

  // Filter menu strictly according to role and division
  const allowedNavItems = rawNavItems.filter((item) => {
    const config = ALL_NAV_ITEMS.find(
      (c) => c.href === item.href || (c.href === "/" && item.href === "/pembina")
    );
    if (!config) return true;
    return isRouteAllowedForUser(config, currentUser.role, currentUser.divisi);
  });

  return (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu Navigasi Lengkap"
          className="fixed inset-0 z-50 lg:hidden flex justify-end"
        >
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 bg-cosmic/80 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full max-w-xs sm:max-w-sm h-full bg-surface-1 border-l border-studio-border-subtle flex flex-col justify-between shadow-2xl z-10 overflow-hidden"
          >
            {/* Header Drawer */}
            <div className="p-4 border-b border-studio-border-subtle flex items-center justify-between gap-3 bg-surface-2/60">
              <div className="flex items-center gap-2">
                <SpectrumLogo size="sm" />
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Tutup menu navigasi"
                className="p-2 rounded-xl text-studio-text-secondary hover:text-white hover:bg-surface-3 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Pill */}
            <div className="p-4 border-b border-studio-border-subtle bg-gradient-to-r from-surface-2/80 to-surface-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600/30 to-pink-600/30 border border-violet-500/30 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                  {currentUser.nama.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                    {currentUser.nama}
                  </h4>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/30 uppercase">
                      {currentUser.role.replace(/_/g, " ")}
                    </span>
                    {currentUser.divisi && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-slate-300 bg-surface-3 border border-white/10">
                        {currentUser.divisi}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Nav Menu Items List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-studio-text-muted flex items-center justify-between">
                <span>Fitur &amp; Menu Anda ({allowedNavItems.length})</span>
                <Sparkles className="w-3 h-3 text-spectrum-amber" />
              </div>

              {allowedNavItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[48px] border",
                      isActive
                        ? "bg-spectrum-cyan/15 text-spectrum-cyan border-spectrum-cyan/30 font-bold shadow-cyan"
                        : "text-slate-300 hover:text-white hover:bg-surface-2 border-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          isActive
                            ? "bg-spectrum-cyan/20 text-spectrum-cyan"
                            : "bg-surface-2 text-slate-400"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-bold bg-white/10 text-white border border-white/20">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-studio-text-secondary truncate mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </Link>
                );
              })}
            </div>

            {/* Bottom Actions: Offline Toggle & Logout */}
            <div className="p-4 border-t border-studio-border-subtle bg-surface-2/60 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <button
                  onClick={() => setIsOffline(!isOffline)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border min-h-[44px]",
                    isOffline
                      ? "bg-spectrum-amber/20 border-spectrum-amber text-spectrum-amber font-bold"
                      : "bg-surface-1 border-studio-border-subtle text-slate-300 hover:text-white"
                  )}
                >
                  {isOffline ? (
                    <>
                      <WifiOff className="w-4 h-4 text-spectrum-amber" />
                      <span>Mode Offline</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4 text-spectrum-jade" />
                      <span>Mode Online</span>
                    </>
                  )}
                </button>

                <button
                  onClick={async () => {
                    setIsMobileMenuOpen(false);
                    await logout();
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-all min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar</span>
                </button>
              </div>

              <p className="text-[10px] font-mono text-center text-studio-text-muted">
                Broadcast Spensa OS · v3.1.0 Mobile
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
