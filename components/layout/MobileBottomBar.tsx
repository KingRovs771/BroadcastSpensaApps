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
} from "lucide-react";

import { useSession } from "../shared/SessionContext";
import { ALL_NAV_ITEMS, isRouteAllowedForUser } from "@/lib/utils/nav-permissions";

export function MobileBottomBar() {
  const pathname = usePathname();
  const { currentUser } = useSession();

  const allMobileCandidates = [
    { label: "Home", href: currentUser.role === "pembina" ? "/pembina" : "/", icon: LayoutDashboard },
    { label: "Produksi", href: "/produksi", icon: Video },
    { label: "Kas", href: "/kas", icon: Wallet },
    { label: "Absensi", href: "/absensi", icon: CalendarCheck },
    { label: "Project", href: "/project", icon: FolderGit2 },
  ];

  const navItems = allMobileCandidates.filter((item) => {
    const config = ALL_NAV_ITEMS.find((c) => c.href === item.href || (c.href === "/" && item.href === "/pembina"));
    if (!config) return true;
    return isRouteAllowedForUser(config, currentUser.role, currentUser.divisi);
  });

  return (
    <nav
      aria-label="Navigasi Bawah Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface-1/95 backdrop-blur-lg border-t border-studio-border-subtle z-40 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]"
    >
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={`Buka halaman ${item.label}`}
            className={cn(
              "flex flex-col items-center justify-center min-w-[56px] min-h-[48px] rounded-lg transition-all",
              isActive
                ? "text-spectrum-cyan font-bold"
                : "text-studio-text-secondary hover:text-white"
            )}
          >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
