"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "@/components/shared/SessionContext";
import { AuditLogItem, UserRole } from "@/lib/mock/store";
import { AuditLogDetailModal } from "@/components/modules/audit/AuditLogDetailModal";
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  RefreshCw,
  FileText,
  Database,
  Calendar,
  User,
  Eye,
  Activity,
  Clock,
  Lock,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export default function AuditLogPage() {
  const { currentUser, auditLogs, refreshData } = useSession();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 1. Role Guard: Exclusive for Administrator (or Pembina with read-only)
  if (currentUser.role !== "administrator") {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Akses Terbatas: 403 Forbidden
        </h1>
        <p className="text-sm text-studio-text-secondary leading-relaxed mb-6">
          Halaman Audit Log Aktivitas Pengguna merupakan area isolasi keamanan tinggi yang dikhususkan bagi{" "}
          <strong className="text-white">Administrator Sistem</strong>. Seluruh riwayat mutasi diaudit dan dilindungi kebijakan Row Level Security (RLS).
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-medium text-white text-xs font-semibold transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Dashboard Utama</span>
        </Link>
      </div>
    );
  }

  // 2. Refresh Handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // 3. Filtered Audit Logs
  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDetails = log.details?.toLowerCase().includes(q);
          const matchActor = log.actor_name.toLowerCase().includes(q);
          const matchAction = log.action.toLowerCase().includes(q);
          const matchTable = log.target_table.toLowerCase().includes(q);
          const matchId = log.target_id?.toLowerCase().includes(q);
          if (!matchDetails && !matchActor && !matchAction && !matchTable && !matchId) {
            return false;
          }
        }

        // Action Category Filter
        if (selectedCategory !== "ALL") {
          const act = log.action.toUpperCase();
          if (selectedCategory === "AUTH") {
            if (
              !act.includes("REGISTER") &&
              !act.includes("RESET") &&
              !act.includes("LOGIN") &&
              !act.includes("USER")
            ) {
              return false;
            }
          } else if (selectedCategory === "ANGGOTA") {
            if (!act.includes("ANGGOTA")) return false;
          } else if (selectedCategory === "KEUANGAN") {
            if (!act.includes("KAS") && !act.includes("KEUANGAN") && !act.includes("BAYAR")) {
              return false;
            }
          } else if (selectedCategory === "PRODUKSI") {
            if (!act.includes("PRODUKSI") && !act.includes("GATE") && !act.includes("NASKAH")) {
              return false;
            }
          } else if (selectedCategory === "OPERASIONAL") {
            if (
              !act.includes("ABSENSI") &&
              !act.includes("NOTULEN") &&
              !act.includes("PROJECT") &&
              !act.includes("INVENTARIS") &&
              !act.includes("FOTO")
            ) {
              return false;
            }
          }
        }

        // Role Filter
        if (selectedRole !== "ALL" && log.actor_role !== selectedRole) {
          return false;
        }

        // Period Filter
        if (selectedPeriod !== "ALL") {
          const logDate = new Date(log.timestamp).getTime();
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;

          if (selectedPeriod === "TODAY") {
            const startOfToday = new Date().setHours(0, 0, 0, 0);
            if (logDate < startOfToday) return false;
          } else if (selectedPeriod === "7DAYS") {
            if (now - logDate > 7 * oneDay) return false;
          } else if (selectedPeriod === "30DAYS") {
            if (now - logDate > 30 * oneDay) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [auditLogs, searchQuery, selectedCategory, selectedRole, selectedPeriod, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(start, start + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  // Key Statistics
  const stats = useMemo(() => {
    const total = auditLogs.length;
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const todayCount = auditLogs.filter(
      (l) => new Date(l.timestamp).getTime() >= startOfToday
    ).length;
    const uniqueActors = new Set(auditLogs.map((l) => l.actor_id)).size;
    const criticalOps = auditLogs.filter((l) => {
      const act = l.action.toUpperCase();
      return (
        act.includes("DELETE") ||
        act.includes("RESET") ||
        act.includes("SYSTEM") ||
        act.includes("HAPUS")
      );
    }).length;

    return { total, todayCount, uniqueActors, criticalOps };
  }, [auditLogs]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      setExportNotice("Tidak ada log audit untuk diekspor.");
      setTimeout(() => setExportNotice(null), 3000);
      return;
    }

    const headers = [
      "ID Log",
      "Timestamp",
      "Waktu Lokal",
      "Aktor ID",
      "Nama Aktor",
      "Role Aktor",
      "Divisi",
      "Aksi",
      "Tabel Target",
      "Target ID",
      "Deskripsi Mutasi",
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${new Date(log.timestamp).toLocaleString("id-ID")}"`,
      `"${log.actor_id}"`,
      `"${log.actor_name.replace(/"/g, '""')}"`,
      `"${log.actor_role}"`,
      `"${log.divisi || "-"}"`,
      `"${log.action}"`,
      `"${log.target_table}"`,
      `"${log.target_id || "-"}"`,
      `"${(log.details || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `audit-log-spensa-${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Berhasil mengekspor ${filteredLogs.length} rekam jejak ke format CSV.`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const getActionBadgeStyle = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("DELETE") || act.includes("RESET") || act.includes("HAPUS")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    }
    if (act.includes("CREATE") || act.includes("TAMBAH") || act.includes("REGISTER") || act.includes("BAYAR")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
    if (act.includes("UPDATE") || act.includes("EDIT") || act.includes("MUTASI")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    }
    if (act.includes("APPROVE") || act.includes("REVIEW") || act.includes("VERIF")) {
      return "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
    }
    return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-studio-border-subtle">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 rounded-lg bg-spectrum-cyan/10 text-spectrum-cyan border border-spectrum-cyan/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Audit Log Aktivitas Pengguna
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-2 text-spectrum-cyan border border-spectrum-cyan/30">
              IMMUTABLE FEED
            </span>
          </div>
          <p className="text-xs sm:text-sm text-studio-text-secondary">
            Inspeksi forensik mutasi data, histori operasional, dan integritas transaksi sistem seluruh akun pengguna.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-white text-xs font-semibold flex items-center gap-1.5 transition min-h-[44px]"
            title="Muat ulang riwayat dari basis data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-spectrum-cyan" : ""}`} />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-spectrum-cyan/15 hover:bg-spectrum-cyan/25 border border-spectrum-cyan/30 text-spectrum-cyan text-xs font-semibold flex items-center gap-1.5 transition min-h-[44px]"
            title="Unduh seluruh rekam jejak dalam format CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Export Notice Banner */}
      {exportNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="p-1 hover:text-white"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── KPI Metrics Overview ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-spectrum-cyan/10 border border-spectrum-cyan/20 flex items-center justify-center text-spectrum-cyan shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-studio-text-muted font-medium">Total Aktivitas</p>
            <h3 className="text-xl font-bold text-white font-mono mt-0.5">{stats.total}</h3>
            <span className="text-[10px] text-studio-text-secondary font-mono">Terekam di Supabase</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-studio-text-muted font-medium">Aktivitas Hari Ini</p>
            <h3 className="text-xl font-bold text-emerald-400 font-mono mt-0.5">{stats.todayCount}</h3>
            <span className="text-[10px] text-studio-text-secondary font-mono">Sejak 00:00 WIB</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-studio-text-muted font-medium">Aktor Terdaftar</p>
            <h3 className="text-xl font-bold text-white font-mono mt-0.5">{stats.uniqueActors}</h3>
            <span className="text-[10px] text-studio-text-secondary font-mono">Pelaku mutasi data</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-studio-text-muted font-medium">Operasi Kritis</p>
            <h3 className="text-xl font-bold text-amber-400 font-mono mt-0.5">{stats.criticalOps}</h3>
            <span className="text-[10px] text-studio-text-secondary font-mono">Delete / Reset Pwd</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar: Search & Filter ────────────────────────────────────────── */}
      <div className="p-4 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-3 shadow-sm">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-studio-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari berdasarkan nama aktor, aksi, deskripsi, atau ID entitas..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-2 border border-studio-border-subtle text-white placeholder-studio-text-muted text-xs focus:border-spectrum-cyan focus:outline-none transition min-h-[44px]"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-studio-text-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Category Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 rounded-xl bg-surface-2 border border-studio-border-subtle text-white text-xs focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            >
              <option value="ALL">Semua Kategori Aksi</option>
              <option value="AUTH">Otentikasi & Akun User</option>
              <option value="ANGGOTA">Data Anggota & Siswa</option>
              <option value="KEUANGAN">Keuangan & Kas</option>
              <option value="PRODUKSI">Produksi & Gate Pipeline</option>
              <option value="OPERASIONAL">Operasional & Presensi</option>
            </select>

            {/* Role Filter */}
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 rounded-xl bg-surface-2 border border-studio-border-subtle text-white text-xs focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            >
              <option value="ALL">Semua Role Aktor</option>
              <option value="administrator">Administrator</option>
              <option value="pembina">Dewan Pembina</option>
              <option value="ketua_broadcast">Ketua Broadcast</option>
              <option value="sekretaris">Sekretaris</option>
              <option value="bendahara">Bendahara</option>
              <option value="div_kreatif">Divisi Kreatif</option>
              <option value="ketua_divisi">Ketua Divisi</option>
              <option value="pj">Penanggung Jawab (PJ)</option>
              <option value="anggota">Anggota Biasa</option>
            </select>

            {/* Time Filter */}
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setCurrentPage(1);
              }}
              className="hidden sm:block px-3 py-2.5 rounded-xl bg-surface-2 border border-studio-border-subtle text-white text-xs focus:border-spectrum-cyan focus:outline-none min-h-[44px]"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="7DAYS">7 Hari Terakhir</option>
              <option value="30DAYS">30 Hari Terakhir</option>
            </select>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="p-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-studio-text-secondary hover:text-white transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              title={`Urutan: ${sortOrder === "desc" ? "Terbaru Dahulu" : "Terlama Dahulu"}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Summary & Active Badges */}
        <div className="flex items-center justify-between text-[11px] text-studio-text-muted pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>Menampilkan <strong className="text-white">{filteredLogs.length}</strong> rekam jejak</span>
            {(searchQuery || selectedCategory !== "ALL" || selectedRole !== "ALL" || selectedPeriod !== "ALL") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("ALL");
                  setSelectedRole("ALL");
                  setSelectedPeriod("ALL");
                  setCurrentPage(1);
                }}
                className="text-spectrum-cyan hover:underline ml-2"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="font-mono">
            Halaman {currentPage} dari {totalPages}
          </div>
        </div>
      </div>

      {/* ── Table & List Representation ────────────────────────────────────── */}
      {paginatedLogs.length === 0 ? (
        <div className="p-12 text-center bg-surface-1 border border-studio-border-subtle rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-2 border border-studio-border-subtle flex items-center justify-center mx-auto text-studio-text-muted">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">
            Tidak Ditemukan Riwayat Log
          </h3>
          <p className="text-xs text-studio-text-secondary max-w-sm mx-auto">
            Tidak ada transaksi audit log yang cocok dengan kriteria pencarian atau filter yang diterapkan.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("ALL");
              setSelectedRole("ALL");
              setSelectedPeriod("ALL");
              setCurrentPage(1);
            }}
            className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-studio-border-medium text-white text-xs font-semibold transition"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block overflow-hidden rounded-2xl bg-surface-1 border border-studio-border-subtle shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-studio-border-subtle bg-surface-2/60 text-studio-text-muted font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-semibold">Waktu & Tanggal</th>
                    <th className="py-3.5 px-4 font-semibold">Aktor / Pengguna</th>
                    <th className="py-3.5 px-4 font-semibold">Aksi</th>
                    <th className="py-3.5 px-4 font-semibold">Tabel Target</th>
                    <th className="py-3.5 px-4 font-semibold">Deskripsi Aktivitas</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-studio-border-subtle">
                  {paginatedLogs.map((log) => {
                    const dateObj = new Date(log.timestamp);
                    const formattedDate = dateObj.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    const formattedTime = dateObj.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <tr
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-surface-2/70 transition-colors cursor-pointer group"
                      >
                        {/* Waktu */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-white font-medium">
                            {formattedTime}
                          </div>
                          <div className="text-[11px] text-studio-text-muted">
                            {formattedDate}
                          </div>
                        </td>

                        {/* Aktor */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-surface-3 border border-studio-border-subtle flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                              {log.actor_name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-white group-hover:text-spectrum-cyan transition-colors truncate max-w-[160px]">
                                {log.actor_name}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-surface-3 text-studio-text-secondary uppercase font-bold">
                                  {log.actor_role}
                                </span>
                                {log.divisi && (
                                  <span className="text-[10px] text-studio-text-muted">
                                    · {log.divisi}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Aksi Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeStyle(
                              log.action
                            )}`}
                          >
                            {log.action}
                          </span>
                        </td>

                        {/* Tabel Target */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-mono text-[11px] text-white">
                            public.{log.target_table}
                          </div>
                          {log.target_id && (
                            <div className="text-[10px] font-mono text-studio-text-muted truncate max-w-[120px]">
                              {log.target_id}
                            </div>
                          )}
                        </td>

                        {/* Deskripsi */}
                        <td className="py-3.5 px-4">
                          <p
                            className="text-xs text-studio-text-secondary truncate max-w-xs xl:max-w-md font-normal"
                            title={log.details}
                          >
                            {log.details || "-"}
                          </p>
                        </td>

                        {/* Opsi */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-studio-text-secondary hover:text-white text-[11px] font-medium transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-spectrum-cyan" />
                            <span>Inspeksi</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card List (Visible on < 768px) */}
          <div className="md:hidden space-y-2.5">
            {paginatedLogs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const formattedTime = dateObj.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const formattedDate = dateObj.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
              });

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-3.5 rounded-xl bg-surface-1 border border-studio-border-subtle space-y-2.5 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                      <p className="font-semibold text-white text-xs mt-1">
                        {log.actor_name}
                      </p>
                      <span className="text-[10px] font-mono text-studio-text-muted uppercase">
                        {log.actor_role} {log.divisi ? `· ${log.divisi}` : ""}
                      </span>
                    </div>

                    <div className="text-right text-[10px] font-mono text-studio-text-muted whitespace-nowrap">
                      <div>{formattedTime}</div>
                      <div>{formattedDate}</div>
                    </div>
                  </div>

                  <p className="text-xs text-studio-text-secondary line-clamp-2">
                    {log.details || `Mutasi pada public.${log.target_table}`}
                  </p>

                  <div className="pt-2 border-t border-studio-border-subtle/50 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-studio-text-muted text-[10px]">
                      Target: public.{log.target_table}
                    </span>
                    <span className="text-spectrum-cyan font-semibold flex items-center gap-1">
                      Lihat Detail &rarr;
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination Controls ─────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-studio-text-muted">
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredLogs.length)} dari{" "}
                {filteredLogs.length} data
              </p>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1.5 rounded-lg bg-surface-1 border border-studio-border-subtle text-xs font-mono text-white">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-surface-2 hover:bg-surface-3 border border-studio-border-subtle text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
                  aria-label="Halaman berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Detail Modal ────────────────────────────────────────────────────── */}
      <AuditLogDetailModal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        log={selectedLog}
      />
    </div>
  );
}
