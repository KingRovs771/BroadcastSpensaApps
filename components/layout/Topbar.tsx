"use client";

import React from "react";
import { useSession } from "../shared/SessionContext";
import { getAcademicSemester } from "@/lib/utils/semester";
import {
  Wifi,
  WifiOff,
  UserCheck,
  Calendar,
  Sparkles,
} from "lucide-react";

export function Topbar() {
  const { currentUser, availableUsers, switchUser, isOffline, setIsOffline } =
    useSession();

  const semesterInfo = getAcademicSemester(new Date());

  return (
    <header className="h-16 bg-surface-1 border-b border-studio-border-subtle px-4 lg:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left info: Semester indicator */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-studio-border-subtle text-xs">
          <Calendar className="w-3.5 h-3.5 text-spectrum-cyan" />
          <span className="font-semibold text-white">{semesterInfo.label}</span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orbital-violet/10 border border-orbital-violet/20 text-[11px] font-mono text-orbital-magenta">
          <Sparkles className="w-3 h-3" />
          <span>Broadcast Spensa OS v3.0</span>
        </div>
      </div>

      {/* Right controls: Offline Toggle + Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Offline Simulation Toggle */}
        <button
          onClick={() => setIsOffline(!isOffline)}
          aria-label={isOffline ? "Beralih ke mode online" : "Simulasikan mode offline"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border min-h-[44px] ${
            isOffline
              ? "bg-spectrum-amber/20 border-spectrum-amber text-spectrum-amber shadow-amber"
              : "bg-surface-2 border-studio-border-subtle text-studio-text-secondary hover:text-white"
          }`}
          title="Klik untuk mensimulasikan mode studio offline"
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

        {/* Dynamic Role Switcher Dropdown */}
        <div className="flex items-center gap-2 bg-surface-2 border border-studio-border-subtle px-2 py-1 rounded-lg">
          <UserCheck className="w-4 h-4 text-orbital-magenta flex-shrink-0" />
          <div className="flex flex-col">
            <label htmlFor="role-select" className="text-[9px] font-mono text-studio-text-muted uppercase">
              Role Demo Switcher
            </label>
            <select
              id="role-select"
              aria-label="Pilih Role Pengguna Demo"
              value={currentUser.id}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer pr-1"
            >
              {availableUsers.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                  className="bg-surface-2 text-white py-1"
                >
                  {user.nama} ({user.role.replace("_", " ")}
                  {user.divisi ? ` - ${user.divisi}` : ""})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
