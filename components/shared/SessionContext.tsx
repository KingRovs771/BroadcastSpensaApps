"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  UserProfile,
  MOCK_USERS,
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

interface SessionContextType {
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  switchUser: (userId: string) => void;
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
  // Default to Pembina (usr-pembina) for primary monitoring experience
  const [currentUser, setCurrentUser] = useState<UserProfile>(MOCK_USERS[1]);
  const [isOffline, setIsOffline] = useState<boolean>(false);

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

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: "log-1",
      actor_id: "usr-pembina",
      actor_name: "Bpk. Haryanto, S.Pd",
      actor_role: "pembina",
      action: "APPROVE_SCRIPT_TIER_1",
      target_table: "produksi_video",
      target_id: "prod-01",
      details: "Menyetujui naskah Podcast Ep 04 (Dual Gate 1/2)",
      timestamp: "2026-09-02T10:14:00Z",
    },
    {
      id: "log-2",
      actor_id: "usr-ketua-bc",
      actor_name: "Raditya Pratama",
      actor_role: "ketua_broadcast",
      action: "UPDATE_KAS_SETTINGS",
      target_table: "kas_settings",
      details: "Mengatur iuran kas menjadi Rp5.000/minggu",
      timestamp: "2026-08-01T09:00:00Z",
    },
  ]);

  const switchUser = (userId: string) => {
    const found = MOCK_USERS.find((u) => u.id === userId);
    if (found) {
      setCurrentUser(found);
    }
  };

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

  // Browser online/offline listeners
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
        availableUsers: MOCK_USERS,
        switchUser,
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
