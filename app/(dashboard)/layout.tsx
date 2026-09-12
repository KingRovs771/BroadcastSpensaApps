"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { MobileMenuDrawer } from "@/components/layout/MobileMenuDrawer";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { SplashScreen } from "@/components/shared/SplashScreen";
import { useSession } from "@/components/shared/SessionContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoggedIn, isSessionLoading } = useSession();

  // Show splash once per session (stored in sessionStorage so it only shows on first load)
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !sessionStorage.getItem("bs_splash_shown");
  });

  // After Supabase session resolved: redirect if not logged in
  useEffect(() => {
    if (!isSessionLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isSessionLoading, isLoggedIn, router]);

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem("bs_splash_shown", "1");
    setShowSplash(false);
  }, []);

  // While Supabase is resolving the session → minimal spinner
  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-[#030712] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
          <p className="text-[11px] font-mono text-slate-600 tracking-widest">
            MEMERIKSA SESI...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in (will redirect, show nothing)
  if (!isLoggedIn) return null;

  return (
    <>
      {/* Splash screen overlay — shown once per browser session */}
      {showSplash && (
        <SplashScreen onComplete={handleSplashComplete} duration={2600} />
      )}

      <div
        className="min-h-screen bg-cosmic flex flex-col transition-opacity duration-500"
        style={{ opacity: showSplash ? 0 : 1 }}
      >
        <OfflineBanner />
        <div className="flex flex-1 min-h-0">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block shrink-0">
            <Sidebar />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0">
            <Topbar />
            <main className="flex-1 p-4 lg:p-8 overflow-y-auto pb-24 lg:pb-12">
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            </main>
          </div>
        </div>

        {/* Mobile Navigation Drawer & Bottom Bar */}
        <MobileMenuDrawer />
        <MobileBottomBar />
      </div>
    </>
  );
}
