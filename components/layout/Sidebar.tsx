"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SpectrumLogo } from "./SpectrumLogo";
import { useSession } from "../shared/SessionContext";
import { cn } from "@/lib/utils/cn";
import {
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
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { ALL_NAV_ITEMS, isRouteAllowedForUser } from "@/lib/utils/nav-permissions";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser } = useSession();

  const isPrivilegedKeuangan = [
    "pembina",
    "ketua_broadcast",
    "bendahara",
    "administrator",
  ].includes(currentUser.role);

  const rawNavItems = [
    {
      label: "Dashboard",
      href: currentUser.role === "pembina" ? "/pembina" : "/",
      icon: LayoutDashboard,
      badge: currentUser.role === "pembina" ? "PEMBINA" : undefined,
    },
    {
      label: "Produksi Dual-Gate",
      href: "/produksi",
      icon: Video,
      badge: "GATE",
    },
    {
      label: "Buku Kas Anggota",
      href: "/kas",
      icon: Wallet,
    },
    {
      label: "Absensi Mingguan",
      href: "/absensi",
      icon: CalendarCheck,
    },
    {
      label: "Project Kanban",
      href: "/project",
      icon: Kanban,
    },
    {
      label: "Notulen Rapat",
      href: "/notulen",
      icon: FileText,
    },
    {
      label: "Keuangan Pembina",
      href: "/keuangan-pembina",
      icon: Lock,
      restricted: !isPrivilegedKeuangan,
    },
    {
      label: "Agenda Foto / Lomba",
      href: "/agenda-foto",
      icon: Camera,
    },
    {
      label: "Inventaris Aset",
      href: "/inventaris",
      icon: Archive,
    },
    {
      label: "Data Anggota",
      href: "/anggota",
      icon: Users,
    },
    {
      label: "Laporan Semester",
      href: "/laporan",
      icon: Printer,
    },
    {
      label: "Audit Log Sistem",
      href: "/audit-log",
      icon: ShieldCheck,
      badge: "SEC",
    },
  ];

  // Filter navigation menus according to currentUser.role & currentUser.divisi
  const navItems = rawNavItems.filter((item) => {
    const config = ALL_NAV_ITEMS.find((c) => c.href === item.href || (c.href === "/" && item.href === "/pembina"));
    if (!config) return true;
    return isRouteAllowedForUser(config, currentUser.role, currentUser.divisi);
  });

  return (
    <aside className="w-64 bg-surface-1 border-r border-studio-border-subtle flex flex-col justify-between shrink-0 h-full min-h-full">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top Branding */}
        <div className="p-5 border-b border-studio-border-subtle shrink-0">
          <SpectrumLogo size="md" />
        </div>

        {/* User Role Card */}
        <div className="mx-3 my-3 p-3 bg-surface-2 rounded-xl border border-studio-border-subtle flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-full bg-orbital-violet/20 border border-orbital-violet/40 flex items-center justify-center font-bold text-orbital-magenta text-sm shrink-0">
            {currentUser.nama.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">{currentUser.nama}</p>
            <p className="text-[10px] font-mono text-studio-text-secondary uppercase truncate">
              {currentUser.role.replace("_", " ")} {currentUser.divisi ? `· ${currentUser.divisi}` : ""}
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="px-2 py-1 space-y-0.5 overflow-y-auto flex-1 min-h-0">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={`Navigasi ke ${item.label}`}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all group min-h-[44px]",
                  isActive
                    ? "bg-surface-3 text-spectrum-cyan border-l-2 border-spectrum-cyan font-bold shadow-cyan"
                    : "text-studio-text-secondary hover:text-white hover:bg-surface-2",
                  item.restricted && "opacity-50"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-colors",
                      isActive
                        ? "text-spectrum-cyan"
                        : "text-studio-text-muted group-hover:text-white"
                    )}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/30">
                    {item.badge}
                  </span>
                )}
                {item.restricted && (
                  <ShieldAlert className="w-3.5 h-3.5 text-spectrum-tangerine" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Studio Spectrum Signature Bar */}
      <div className="p-4 border-t border-studio-border-subtle bg-surface-1/50 shrink-0">
        <div className="flex items-center justify-between text-[10px] font-mono text-studio-text-muted mb-2">
          <span>SPECTRUM ENGINE</span>
          <span className="text-spectrum-jade">ONLINE</span>
        </div>
        {/* Spectrum Wave Bars */}
        <div className="h-1.5 w-full rounded-full overflow-hidden flex gap-0.5">
          <div className="flex-1 bg-spectrum-gold"></div>
          <div className="flex-1 bg-spectrum-amber"></div>
          <div className="flex-1 bg-spectrum-tangerine"></div>
          <div className="flex-1 bg-spectrum-jade"></div>
          <div className="flex-1 bg-spectrum-cyan"></div>
          <div className="flex-1 bg-spectrum-cobalt"></div>
          <div className="flex-1 bg-orbital-violet"></div>
          <div className="flex-1 bg-orbital-magenta"></div>
        </div>
      </div>
    </aside>
  );
}
