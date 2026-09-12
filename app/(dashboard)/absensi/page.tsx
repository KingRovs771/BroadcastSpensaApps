"use client";

import React, { useState } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { HolidayDeclarationModal } from "@/components/modules/absensi/HolidayDeclarationModal";
import { AbsensiRecord } from "@/lib/mock/store";
import { cn } from "@/lib/utils/cn";
import {
  CalendarCheck,
  CalendarOff,
  Users,
  Award,
  Download,
  AlertTriangle,
  Sparkles,
} from "lucide-react";

export default function AbsensiPage() {
  const {
    currentUser,
    anggotaList,
    absensiList,
    setAbsensiList,
    logAction,
  } = useSession();

  const [activeTab, setActiveTab] = useState<"tetap" | "ekskul">("tetap");
  const [selectedDate, setSelectedDate] = useState<string>("2026-08-08");
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);

  const isSekretarisOrAdmin =
    currentUser.role === "sekretaris" || currentUser.role === "administrator";
  const isPembinaOrKetua =
    currentUser.role === "pembina" ||
    currentUser.role === "ketua_broadcast" ||
    currentUser.role === "administrator";

  // Check if current date is holiday
  const holidayRecord = absensiList.find(
    (a) => a.tanggal === selectedDate && a.is_libur
  );
  const isCurrentDateHoliday = !!holidayRecord;

  // Filter members by tab
  const tabMembers = anggotaList.filter((a) => a.tipe === activeTab);

  // Status mapping
  const statusOptions: Array<{
    value: "masuk" | "izin" | "sakit" | "alpha";
    label: string;
    activeClass: string;
  }> = [
    {
      value: "masuk",
      label: "MASUK",
      activeClass: "bg-spectrum-jade text-ink shadow-jade",
    },
    {
      value: "izin",
      label: "IZIN",
      activeClass: "bg-spectrum-gold text-surface-1 font-bold",
    },
    {
      value: "sakit",
      label: "SAKIT",
      activeClass: "bg-spectrum-cobalt text-ink",
    },
    {
      value: "alpha",
      label: "ALPHA",
      activeClass: "bg-spectrum-tangerine text-ink",
    },
  ];

  // Set single attendance status
  const handleSetStatus = (
    anggotaId: string,
    status: "masuk" | "izin" | "sakit" | "alpha"
  ) => {
    if (isCurrentDateHoliday) {
      alert("Tidak dapat mengubah absensi pada pekan libur resmi!");
      return;
    }

    if (!isSekretarisOrAdmin) {
      alert("Hanya Sekretaris yang berwenang mencatat presensi kehadiran mingguan!");
      return;
    }

    setAbsensiList((prev) => {
      const existing = prev.find(
        (a) =>
          a.anggota_id === anggotaId &&
          a.tanggal === selectedDate &&
          a.anggota_tipe === activeTab
      );

      if (existing) {
        return prev.map((a) =>
          a.id === existing.id
            ? { ...a, status, dicatat_oleh: currentUser.id }
            : a
        );
      } else {
        const newRecord: AbsensiRecord = {
          id: `ab-${Date.now()}-${Math.random().toString(36).substring(2, 4)}`,
          anggota_id: anggotaId,
          anggota_tipe: activeTab,
          tanggal: selectedDate,
          pertemuan_ke: 1,
          status,
          is_libur: false,
          dicatat_oleh: currentUser.id,
        };
        return [...prev, newRecord];
      }
    });

    const ang = anggotaList.find((a) => a.id === anggotaId);
    logAction(
      "UPDATE_ABSENSI",
      "absensi",
      anggotaId,
      `Sekretaris menandai status ${status.toUpperCase()} untuk ${ang?.nama_lengkap}`
    );
  };

  // Declare Holiday
  const handleDeclareHoliday = (alasan: string) => {
    setAbsensiList((prev) => {
      // Mark all existing records for this date as holiday or insert
      const updated = prev.filter((a) => a.tanggal !== selectedDate);
      const holidayRecords: AbsensiRecord[] = anggotaList.map((ang) => ({
        id: `ab-libur-${ang.id}-${selectedDate}`,
        anggota_id: ang.id,
        anggota_tipe: ang.tipe,
        tanggal: selectedDate,
        pertemuan_ke: 1,
        status: "izin",
        is_libur: true,
        libur_oleh: currentUser.id,
        libur_alasan: alasan,
      }));
      return [...updated, ...holidayRecords];
    });

    logAction(
      "DECLARE_HOLIDAY",
      "absensi",
      undefined,
      `${currentUser.nama} mendeklarasikan pekan libur pada ${selectedDate}: ${alasan}`
    );
  };

  // Cancel Holiday
  const handleCancelHoliday = () => {
    if (!isPembinaOrKetua) return;
    setAbsensiList((prev) =>
      prev.filter((a) => !(a.tanggal === selectedDate && a.is_libur))
    );
    logAction(
      "CANCEL_HOLIDAY",
      "absensi",
      undefined,
      `Membatalkan status pekan libur pada ${selectedDate}`
    );
  };

  // Calculate Attendance Percentage for current tab
  const totalRelevantRecords = absensiList.filter(
    (a) => a.anggota_tipe === activeTab && !a.is_libur
  );
  const totalMasuk = totalRelevantRecords.filter((a) => a.status === "masuk").length;
  const attendancePercentage =
    totalRelevantRecords.length > 0
      ? Math.round((totalMasuk / totalRelevantRecords.length) * 100)
      : 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-spectrum-cyan" />
            Absensi Mingguan & Presensi Studio
          </h1>
          <p className="text-xs text-studio-text-secondary mt-1">
            Pemisahan register Anggota Tetap vs Ekskul dan override kalender libur resmi.
          </p>
        </div>

        {/* Date Selector & Holiday Action */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-surface-1 border border-studio-border-subtle px-3 py-1.5 rounded-xl">
            <label htmlFor="absensi-date" className="text-[10px] font-mono text-studio-text-muted uppercase">
              Sesi:
            </label>
            <input
              id="absensi-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>

          {isPembinaOrKetua && (
            <>
              {isCurrentDateHoliday ? (
                <button
                  onClick={handleCancelHoliday}
                  aria-label="Batalkan status libur resmi"
                  className="px-3.5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-spectrum-jade text-xs font-bold border border-spectrum-jade/40 transition-colors min-h-[44px]"
                >
                  Buka Kembali Sesi
                </button>
              ) : (
                <button
                  onClick={() => setIsHolidayModalOpen(true)}
                  aria-label="Deklarasikan hari libur resmi"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-spectrum-amber/20 hover:bg-spectrum-amber/30 text-spectrum-amber text-xs font-bold border border-spectrum-amber/40 transition-colors min-h-[44px]"
                >
                  <CalendarOff className="w-4 h-4" />
                  <span>Set Pekan Libur</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Segregated Visual Tabs */}
      <div className="flex items-center gap-3 border-b border-studio-border-subtle">
        <button
          onClick={() => setActiveTab("tetap")}
          aria-label="Tab Anggota Tetap"
          className={cn(
            "flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all relative min-h-[44px]",
            activeTab === "tetap"
              ? "text-spectrum-cyan border-b-2 border-spectrum-cyan shadow-cyan font-extrabold"
              : "text-studio-text-secondary hover:text-white"
          )}
        >
          <Award className="w-4 h-4" />
          <span>Anggota Tetap</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-spectrum-cyan/20 text-spectrum-cyan border border-spectrum-cyan/30">
            {anggotaList.filter((a) => a.tipe === "tetap").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("ekskul")}
          aria-label="Tab Anggota Ekskul"
          className={cn(
            "flex items-center gap-2 pb-3 px-4 text-xs font-bold transition-all relative min-h-[44px]",
            activeTab === "ekskul"
              ? "text-orbital-magenta border-b-2 border-orbital-violet shadow-orbital font-extrabold"
              : "text-studio-text-secondary hover:text-white"
          )}
        >
          <Users className="w-4 h-4" />
          <span>Anggota Ekskul</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-orbital-violet/20 text-orbital-magenta border border-orbital-violet/30">
            {anggotaList.filter((a) => a.tipe === "ekskul").length}
          </span>
        </button>
      </div>

      {/* Summary attendance metric bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-studio-text-secondary uppercase">
            Persentase Kehadiran
          </p>
          <p className="text-xl font-bold font-mono text-spectrum-jade mt-0.5">
            {attendancePercentage}%
          </p>
        </div>
        <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-jade uppercase">
            Hadir Masuk
          </p>
          <p className="text-xl font-bold font-mono text-white mt-0.5">
            {
              absensiList.filter(
                (a) =>
                  a.tanggal === selectedDate &&
                  a.anggota_tipe === activeTab &&
                  a.status === "masuk" &&
                  !a.is_libur
              ).length
            }
          </p>
        </div>
        <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-gold uppercase">
            Izin / Sakit
          </p>
          <p className="text-xl font-bold font-mono text-white mt-0.5">
            {
              absensiList.filter(
                (a) =>
                  a.tanggal === selectedDate &&
                  a.anggota_tipe === activeTab &&
                  (a.status === "izin" || a.status === "sakit") &&
                  !a.is_libur
              ).length
            }
          </p>
        </div>
        <div className="p-3 rounded-xl bg-surface-1 border border-studio-border-subtle">
          <p className="text-[10px] font-mono font-bold text-spectrum-tangerine uppercase">
            Alpha Tanpa Berita
          </p>
          <p className="text-xl font-bold font-mono text-white mt-0.5">
            {
              absensiList.filter(
                (a) =>
                  a.tanggal === selectedDate &&
                  a.anggota_tipe === activeTab &&
                  a.status === "alpha" &&
                  !a.is_libur
              ).length
            }
          </p>
        </div>
      </div>

      {/* Attendance Checklist Grid with Holiday Watermark */}
      <div className="bg-surface-1 border border-studio-border-subtle rounded-2xl p-4 lg:p-6 relative overflow-hidden">
        {/* Holiday Watermark Overlay */}
        {isCurrentDateHoliday && (
          <div className="absolute inset-0 bg-cosmic/75 backdrop-blur-xs z-20 flex items-center justify-center pointer-events-auto">
            <div className="text-center p-6 max-w-md bg-surface-2/90 border border-spectrum-amber/40 rounded-2xl shadow-2xl">
              <CalendarOff className="w-12 h-12 text-spectrum-amber mx-auto mb-2 animate-bounce" />
              <h3 className="text-base font-bold font-mono text-spectrum-amber uppercase tracking-wider">
                LIBUR RESMI EKSTRAKURIKULER
              </h3>
              <p className="text-xs text-white mt-1">
                "{holidayRecord?.libur_alasan}"
              </p>
              <p className="text-[11px] font-mono text-studio-text-secondary mt-2">
                Presensi dikunci sementara dan tidak dihitung ke rasio kehadiran.
              </p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[550px]">
            <thead>
              <tr className="border-b border-studio-border-subtle text-[11px] font-mono uppercase text-studio-text-secondary">
                <th className="py-3 px-3">Nama Siswa</th>
                <th className="py-3 px-2">Kelas</th>
                <th className="py-3 px-2">Jabatan / Divisi</th>
                <th className="py-3 px-3 text-center">Status Presensi (4-Pill)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-studio-border-subtle text-xs">
              {tabMembers.map((ang) => {
                const record = absensiList.find(
                  (a) =>
                    a.anggota_id === ang.id &&
                    a.tanggal === selectedDate &&
                    a.anggota_tipe === activeTab
                );
                const currentStatus = record?.status || "masuk";

                return (
                  <tr key={ang.id} className="hover:bg-surface-2/60 transition-colors">
                    <td className="py-3 px-3">
                      <p className="font-bold text-white">{ang.nama_lengkap}</p>
                      <p className="text-[10px] font-mono text-studio-text-muted">
                        NIS: {ang.nis}
                      </p>
                    </td>
                    <td className="py-3 px-2 font-mono text-studio-text-secondary">
                      {ang.kelas}
                    </td>
                    <td className="py-3 px-2 text-studio-text-secondary">
                      {ang.jabatan} {ang.divisi ? `· ${ang.divisi}` : ""}
                    </td>

                    {/* 4-Segment Discrete Radio Pills */}
                    <td className="py-3 px-3">
                      <div className="flex items-center justify-center gap-1.5 bg-surface-2 p-1 rounded-xl border border-studio-border-subtle max-w-fit mx-auto">
                        {statusOptions.map((opt) => {
                          const isSelected = currentStatus === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={isCurrentDateHoliday}
                              onClick={() => handleSetStatus(ang.id, opt.value)}
                              aria-label={`Set presensi ${opt.label} untuk ${ang.nama_lengkap}`}
                              className={cn(
                                "px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all min-h-[36px]",
                                isSelected
                                  ? opt.activeClass
                                  : "text-studio-text-secondary hover:text-white hover:bg-surface-3"
                              )}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Holiday Declaration Modal */}
      <HolidayDeclarationModal
        currentDate={selectedDate}
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        onDeclared={handleDeclareHoliday}
      />
    </div>
  );
}

