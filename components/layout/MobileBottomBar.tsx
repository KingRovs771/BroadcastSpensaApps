"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Video,
  Wallet,
  CalendarCheck,
  FolderGit2,
  Users,
  FileText,
  Lock,
  LayoutGrid,
  ShieldCheck,
  Printer,
  Archive,
  Camera,
} from "lucide-react";

import { useSession } from "../shared/SessionContext";
import { ALL_NAV_ITEMS, isRouteAllowedForUser } from "@/lib/utils/nav-permissions";

export function MobileBottomBar() {
  const pathname = usePathname();
  const { currentUser, isMobileMenuOpen, setIsMobileMenuOpen } = useSession();

  // Susun 4 menu utama yang paling relevan secara adaptif sesuai peran pengguna
  const getRoleTailoredPrimaryItems = () => {
    switch (currentUser.role) {
      case "pembina":
        return [
          { label: "Monitoring", href: "/pembina", icon: ShieldCheck },
          { label: "Produksi", href: "/produksi", icon: Video },
          { label: "Keuangan", href: "/keuangan-pembina", icon: Lock },
          { label: "Anggota", href: "/anggota", icon: Users },
        ];
      case "administrator":
        return [
          { label: "Dashboard", href: "/", icon: LayoutDashboard },
          { label: "Pembina", href: "/pembina", icon: ShieldCheck },
          { label: "Anggota", href: "/anggota", icon: Users },
          { label: "Produksi", href: "/produksi", icon: Video },
        ];
      case "sekretaris":
        return [
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "Anggota", href: "/anggota", icon: Users },
          { label: "Absensi", href: "/absensi", icon: CalendarCheck },
          { label: "Notulen", href: "/notulen", icon: FileText },
        ];
      case "bendahara":
        return [
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "Kas", href: "/kas", icon: Wallet },
          { label: "Keuangan", href: "/keuangan-pembina", icon: Lock },
          { label: "Laporan", href: "/laporan", icon: Printer },
        ];
      case "ketua_broadcast":
        return [
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "Produksi", href: "/produksi", icon: Video },
          { label: "Anggota", href: "/anggota", icon: Users },
          { label: "Kas", href: "/kas", icon: Wallet },
        ];
      case "ketua_divisi":
        return [
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "Produksi", href: "/produksi", icon: Video },
          { label: "Project", href: "/project", icon: FolderGit2 },
          {
            label: currentUser.divisi === "Fotografer" ? "Foto" : "Inventaris",
            href: currentUser.divisi === "Fotografer" ? "/agenda-foto" : "/inventaris",
            icon: currentUser.divisi === "Fotografer" ? Camera : Archive,
          },
        ];
      case "div_kreatif":
      case "pj":
        return [
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "Produksi", href: "/produksi", icon: Video },
          { label: "Project", href: "/project", icon: FolderGit2 },
          { label: "Inventaris", href: "/inventaris", icon: Archive },
        ];
      default:
        return [
          { label: "Home", href: "/", icon: LayoutDashboard },
          { label: "Project", href: "/project", icon: FolderGit2 },
          { label: "Inventaris", href: "/inventaris", icon: Archive },
          { label: "Produksi", href: "/produksi", icon: Video },
        ];
    }
  };

  const primaryItems = getRoleTailoredPrimaryItems().filter((item) => {
    const config = ALL_NAV_ITEMS.find(
      (c) => c.href === item.href || (c.href === "/" && item.href === "/pembina")
    );
    if (!config) return true;
    return isRouteAllowedForUser(config, currentUser.role, currentUser.divisi);
  });

  // Hitung total fitur yang diizinkan untuk role ini
  const totalAllowedRoutes = ALL_NAV_ITEMS.filter((config) =>
    isRouteAllowedForUser(config, currentUser.role, currentUser.divisi)
  ).length;

  // Apakah halaman saat ini berada di luar 4 primary items?
  const isViewingOtherMenu = !primaryItems.some(
    (item) =>
      pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
  );

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-1/95 backdrop-blur-lg border-t border-studio-border-subtle z-40 flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)]"
    >
      {/* 4 Role-Tailored Primary Shortcuts */}
      {primaryItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={`Buka ${item.label}`}
            className={cn(
              "flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all relative",
              isActive
                ? "text-spectrum-cyan font-bold"
                : "text-studio-text-secondary hover:text-white"
            )}
          >
            <div className="relative">
              <Icon className="w-5 h-5 mb-0.5" />
              {isActive && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-spectrum-cyan shadow-cyan" />
              )}
            </div>
            <span className="text-[10px] tracking-tight truncate max-w-[56px] text-center">
              {item.label}
            </span>
          </Link>
        );
      })}

      {/* 5. Menu Drawer Button (Semua Fitur Sesuai Role) */}
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        aria-label="Buka Semua Menu Navigasi"
        className={cn(
          "flex flex-col items-center justify-center min-w-[54px] min-h-[48px] rounded-xl transition-all relative",
          isMobileMenuOpen || isViewingOtherMenu
            ? "text-orbital-magenta font-bold"
            : "text-studio-text-secondary hover:text-white"
        )}
      >
        <div className="relative">
          <LayoutGrid className="w-5 h-5 mb-0.5" />
          <span className="absolute -top-1 -right-2 px-1 py-0.1 rounded-full text-[8px] font-mono font-bold bg-orbital-violet/40 text-orbital-magenta border border-orbital-violet/50">
            {totalAllowedRoutes}
          </span>
        </div>
        <span className="text-[10px] tracking-tight">Semua</span>
      </button>
    </nav>
  );
}
