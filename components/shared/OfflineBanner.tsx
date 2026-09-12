"use client";

import React from "react";
import { useSession } from "./SessionContext";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const { isOffline } = useSession();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-spectrum-amber/20 border-b border-spectrum-amber text-spectrum-amber px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50 backdrop-blur-md"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <span>
        Mode Studio Offline — Perubahan absensi & kas disimpan lokal dan akan disinkronkan otomatis saat online.
      </span>
    </div>
  );
}
