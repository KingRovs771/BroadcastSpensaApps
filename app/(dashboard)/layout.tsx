import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { OfflineBanner } from "@/components/shared/OfflineBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cosmic flex flex-col">
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

      {/* Mobile Bottom Bar */}
      <MobileBottomBar />
    </div>
  );
}
