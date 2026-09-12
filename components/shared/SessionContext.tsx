"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserProfile,
  UserRole,
  DivisiName,
  AnggotaRecord,
  INITIAL_ANGGOTA,
  KasSettings,
  INITIAL_KAS_SETTINGS,
  KasPembayaran,
  INITIAL_KAS_PEMBAYARAN,
  ProduksiVideo,
  INITIAL_PRODUKSI,
  ProjectKanban,
  INITIAL_PROJECTS,
  AgendaFoto,
  INITIAL_AGENDA_FOTO,
  InventarisItem,
  INITIAL_INVENTARIS,
  NotulenItem,
  INITIAL_NOTULEN,
  KeuanganPembinaItem,
  INITIAL_KEUANGAN_PEMBINA,
  AbsensiRecord,
  INITIAL_ABSENSI,
  AuditLogItem,
} from "@/lib/mock/store";

// ─── Fallback guest profile ────────────────────────────────────────────────────
const GUEST_PROFILE: UserProfile = {
  id: "guest",
  nama: "Tamu",
  email: "",
  role: "anggota",
};

// ─── Context type ─────────────────────────────────────────────────────────────
interface SessionContextType {
  currentUser: UserProfile;
  isLoggedIn: boolean;
  isSessionLoading: boolean; // true while restoring session from Supabase/storage
  loginWithProfile: (profile: UserProfile) => void;
  logout: () => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;

  // Data collections
  anggotaList: AnggotaRecord[];
  setAnggotaList: React.Dispatch<React.SetStateAction<AnggotaRecord[]>>;

  produksiList: ProduksiVideo[];
  setProduksiList: React.Dispatch<React.SetStateAction<ProduksiVideo[]>>;

  kasSettings: KasSettings;
  setKasSettings: React.Dispatch<React.SetStateAction<KasSettings>>;
  kasPembayaranList: KasPembayaran[];
  setKasPembayaranList: React.Dispatch<React.SetStateAction<KasPembayaran[]>>;

  absensiList: AbsensiRecord[];
  setAbsensiList: React.Dispatch<React.SetStateAction<AbsensiRecord[]>>;

  projectList: ProjectKanban[];
  setProjectList: React.Dispatch<React.SetStateAction<ProjectKanban[]>>;

  agendaFotoList: AgendaFoto[];
  setAgendaFotoList: React.Dispatch<React.SetStateAction<AgendaFoto[]>>;

  inventarisList: InventarisItem[];
  setInventarisList: React.Dispatch<React.SetStateAction<InventarisItem[]>>;

  notulenList: NotulenItem[];
  setNotulenList: React.Dispatch<React.SetStateAction<NotulenItem[]>>;

  keuanganPembinaList: KeuanganPembinaItem[];
  setKeuanganPembinaList: React.Dispatch<React.SetStateAction<KeuanganPembinaItem[]>>;

  auditLogs: AuditLogItem[];
  logAction: (action: string, targetTable: string, targetId?: string, details?: string) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<UserProfile>(GUEST_PROFILE);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isSessionLoading, setIsSessionLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Data collections (empty by default — filled from Supabase after auth)
  const [anggotaList, setAnggotaList] = useState<AnggotaRecord[]>(INITIAL_ANGGOTA);
  const [produksiList, setProduksiList] = useState<ProduksiVideo[]>(INITIAL_PRODUKSI);
  const [kasSettings, setKasSettings] = useState<KasSettings>(INITIAL_KAS_SETTINGS);
  const [kasPembayaranList, setKasPembayaranList] = useState<KasPembayaran[]>(INITIAL_KAS_PEMBAYARAN);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>(INITIAL_ABSENSI);
  const [projectList, setProjectList] = useState<ProjectKanban[]>(INITIAL_PROJECTS);
  const [agendaFotoList, setAgendaFotoList] = useState<AgendaFoto[]>(INITIAL_AGENDA_FOTO);
  const [inventarisList, setInventarisList] = useState<InventarisItem[]>(INITIAL_INVENTARIS);
  const [notulenList, setNotulenList] = useState<NotulenItem[]>(INITIAL_NOTULEN);
  const [keuanganPembinaList, setKeuanganPembinaList] = useState<KeuanganPembinaItem[]>(INITIAL_KEUANGAN_PEMBINA);

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // ── Fetch profile from Supabase profiles table ─────────────────────────────
  const fetchAndSetProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nama, email, role, divisi, signature_url")
        .eq("id", userId)
        .single();

      if (error || !data) return null;

      const profile: UserProfile = {
        id: data.id,
        nama: data.nama,
        email: data.email,
        role: data.role as UserRole,
        divisi: data.divisi as DivisiName | undefined,
        signature_url: data.signature_url ?? undefined,
      };
      return profile;
    } catch {
      return null;
    }
  }, [supabase]);

  // ── Restore session on mount via Supabase onAuthStateChange ───────────────
  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        let profile = await fetchAndSetProfile(session.user.id);
        if (!profile) {
          profile = {
            id: session.user.id,
            nama: session.user.user_metadata?.nama || session.user.email?.split("@")[0] || "Administrator",
            email: session.user.email || "",
            role: "administrator" as UserRole,
          };
        }
        if (mounted) {
          setCurrentUser(profile);
          setIsLoggedIn(true);
        }
      }
      if (mounted) setIsSessionLoading(false);
    });

    // Listen for auth changes (login/logout from other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === "SIGNED_IN" && session?.user) {
          let profile = await fetchAndSetProfile(session.user.id);
          if (!profile) {
            profile = {
              id: session.user.id,
              nama: session.user.user_metadata?.nama || session.user.email?.split("@")[0] || "Administrator",
              email: session.user.email || "",
              role: "administrator" as UserRole,
            };
          }
          setCurrentUser(profile);
          setIsLoggedIn(true);
        } else if (event === "SIGNED_OUT") {
          setCurrentUser(GUEST_PROFILE);
          setIsLoggedIn(false);
        }
        setIsSessionLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAndSetProfile, supabase.auth]);

  // ── loginWithProfile: called after successful Supabase signIn ─────────────
  const loginWithProfile = (profile: UserProfile) => {
    setCurrentUser(profile);
    setIsLoggedIn(true);
  };

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(GUEST_PROFILE);
    setIsLoggedIn(false);
  };

  // ── Audit logger ──────────────────────────────────────────────────────────
  const logAction = (action: string, targetTable: string, targetId?: string, details?: string) => {
    const newLog: AuditLogItem = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      actor_id: currentUser.id,
      actor_name: currentUser.nama,
      actor_role: currentUser.role,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // ── Online/offline listener ───────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        isSessionLoading,
        loginWithProfile,
        logout,
        isOffline,
        setIsOffline,
        anggotaList,
        setAnggotaList,
        produksiList,
        setProduksiList,
        kasSettings,
        setKasSettings,
        kasPembayaranList,
        setKasPembayaranList,
        absensiList,
        setAbsensiList,
        projectList,
        setProjectList,
        agendaFotoList,
        setAgendaFotoList,
        inventarisList,
        setInventarisList,
        notulenList,
        setNotulenList,
        keuanganPembinaList,
        setKeuanganPembinaList,
        auditLogs,
        logAction,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return ctx;
}
