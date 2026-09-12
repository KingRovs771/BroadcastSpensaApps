"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  UserProfile,
  UserRole,
  DivisiName,
  AnggotaRecord,
  KasSettings,
  KasPembayaran,
  ProduksiVideo,
  ProjectKanban,
  AgendaFoto,
  InventarisItem,
  NotulenItem,
  KeuanganPembinaItem,
  AbsensiRecord,
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
  isSessionLoading: boolean;
  loginWithProfile: (profile: UserProfile) => void;
  logout: () => void;
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  refreshData: () => Promise<void>;

  // Data collections (live from Supabase)
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

  pembinaList: UserProfile[];
  setPembinaList: React.Dispatch<React.SetStateAction<UserProfile[]>>;

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

  // Data collections — empty by default for clean production use
  const [anggotaList, setAnggotaList] = useState<AnggotaRecord[]>([]);
  const [pembinaList, setPembinaList] = useState<UserProfile[]>([]);
  const [produksiList, setProduksiList] = useState<ProduksiVideo[]>([]);
  const [kasSettings, setKasSettings] = useState<KasSettings>({
    nominal: 2000,
    periode_type: "mingguan",
    effective_from: new Date().toISOString().split("T")[0],
  });
  const [kasPembayaranList, setKasPembayaranList] = useState<KasPembayaran[]>([]);
  const [absensiList, setAbsensiList] = useState<AbsensiRecord[]>([]);
  const [projectList, setProjectList] = useState<ProjectKanban[]>([]);
  const [agendaFotoList, setAgendaFotoList] = useState<AgendaFoto[]>([]);
  const [inventarisList, setInventarisList] = useState<InventarisItem[]>([]);
  const [notulenList, setNotulenList] = useState<NotulenItem[]>([]);
  const [keuanganPembinaList, setKeuanganPembinaList] = useState<KeuanganPembinaItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // ── Fetch profile from Supabase profiles table ─────────────────────────────
  const fetchAndSetProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nama, email, role, divisi, signature_url")
        .eq("id", userId)
        .maybeSingle();

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

  // ── Load all data live from Supabase ───────────────────────────────────────
  const loadAllDatabaseData = useCallback(async () => {
    try {
      // 1. Anggota
      const { data: anggotaData } = await supabase.from("anggota").select("*");
      if (anggotaData) setAnggotaList(anggotaData as AnggotaRecord[]);

      // 2. Produksi
      const { data: produksiData } = await supabase.from("produksi_video").select("*");
      if (produksiData) setProduksiList(produksiData as ProduksiVideo[]);

      // 3. Kas Settings
      const { data: kasSettingsData } = await supabase
        .from("kas_settings")
        .select("*")
        .order("effective_from", { ascending: false })
        .limit(1);
      if (kasSettingsData && kasSettingsData.length > 0) {
        setKasSettings(kasSettingsData[0] as KasSettings);
      }

      // 4. Kas Pembayaran
      const { data: kasPembayaranData } = await supabase.from("kas_pembayaran").select("*");
      if (kasPembayaranData) setKasPembayaranList(kasPembayaranData as KasPembayaran[]);

      // 5. Absensi
      const { data: absensiData } = await supabase.from("absensi").select("*");
      if (absensiData) setAbsensiList(absensiData as AbsensiRecord[]);

      // 6. Project
      const { data: projectData } = await supabase.from("project").select("*");
      if (projectData) setProjectList(projectData as ProjectKanban[]);

      // 7. Agenda Foto
      const { data: agendaFotoData } = await supabase.from("agenda_foto").select("*");
      if (agendaFotoData) setAgendaFotoList(agendaFotoData as AgendaFoto[]);

      // 8. Inventaris
      const { data: inventarisData } = await supabase.from("inventaris").select("*");
      if (inventarisData) setInventarisList(inventarisData as InventarisItem[]);

      // 9. Notulen
      const { data: notulenData } = await supabase.from("notulen").select("*");
      if (notulenData) setNotulenList(notulenData as NotulenItem[]);

      // 10. Keuangan Pembina
      const { data: keuanganData } = await supabase.from("keuangan_pembina").select("*");
      if (keuanganData) setKeuanganPembinaList(keuanganData as KeuanganPembinaItem[]);

      // 11. Audit Log
      const { data: auditData } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (auditData) {
        setAuditLogs(
          auditData.map((a: any) => ({
            id: a.id,
            actor_id: a.actor_id,
            actor_name: a.actor_role,
            actor_role: a.actor_role as UserRole,
            action: a.action,
            target_table: a.target_table,
            target_id: a.target_id,
            details: a.extra_json?.details,
            timestamp: a.created_at,
          }))
        );
      }

      // 12. Dewan Pembina Profiles
      const { data: pembinaData } = await supabase
        .from("profiles")
        .select("id, nama, email, role, divisi, signature_url")
        .eq("role", "pembina");
      if (pembinaData) {
        setPembinaList(pembinaData as UserProfile[]);
      }
    } catch (err) {
      console.error("Failed to load Supabase data:", err);
    }
  }, [supabase]);

  // Trigger data load when logged in
  useEffect(() => {
    if (isLoggedIn) {
      loadAllDatabaseData();
    }
  }, [isLoggedIn, loadAllDatabaseData]);

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
          // Clear all collections on logout
          setAnggotaList([]);
          setProduksiList([]);
          setKasPembayaranList([]);
          setAbsensiList([]);
          setProjectList([]);
          setAgendaFotoList([]);
          setInventarisList([]);
          setNotulenList([]);
          setKeuanganPembinaList([]);
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
    setAnggotaList([]);
    setProduksiList([]);
    setKasPembayaranList([]);
    setAbsensiList([]);
    setProjectList([]);
    setAgendaFotoList([]);
    setInventarisList([]);
    setNotulenList([]);
    setKeuanganPembinaList([]);
  };

  // ── Audit logger ──────────────────────────────────────────────────────────
  const logAction = async (action: string, targetTable: string, targetId?: string, details?: string) => {
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

    try {
      await supabase.from("audit_log").insert({
        actor_id: currentUser.id === "guest" ? "00000000-0000-0000-0000-000000000000" : currentUser.id,
        actor_role: currentUser.role,
        divisi: currentUser.divisi ?? null,
        action,
        target_table: targetTable,
        target_id: targetId && targetId.length === 36 && targetId.includes("-") ? targetId : null,
        extra_json: details ? { details } : {},
      });
    } catch {
      // ignore
    }
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
        refreshData: loadAllDatabaseData,
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
        pembinaList,
        setPembinaList,
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
