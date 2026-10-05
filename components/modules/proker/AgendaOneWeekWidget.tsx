"use client";

import React, { useMemo } from "react";
import { useSession } from "@/components/shared/SessionContext";
import { CalendarDays, Camera } from "lucide-react";

export interface AgendaEntry {
  date: string;
  title: string;
  type: "proker" | "kanban" | "produksi" | "foto";
  extra?: string;
}

/**
 * Widget Agenda 1 Minggu ke Depan
 * Ditampilkan di dashboard seluruh role.
 * Read-only (hanya view saja tanpa tombol/link navigasi ke menu proker).
 */
export function AgendaOneWeekWidget() {
  const { prokerList, projectList, produksiList, agendaFotoList } = useSession();

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const nextWeekStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  }, []);

  const upcomingAgenda = useMemo(() => {
    const list: AgendaEntry[] = [];

    // 1. Proker status terjadwal dalam 7 hari
    (prokerList || [])
      .filter((p) => p.status === "terjadwal" && p.tanggal >= todayStr && p.tanggal <= nextWeekStr)
      .forEach((p) => {
        list.push({
          date: p.tanggal,
          title: p.nama_kegiatan,
          type: "proker",
          extra: p.lokasi ? `Lokasi: ${p.lokasi}` : undefined,
        });
      });

    // 2. Project Kanban dengan deadline dalam 7 hari
    (projectList || [])
      .filter(
        (p) =>
          p.deadline &&
          p.deadline >= todayStr &&
          p.deadline <= nextWeekStr &&
          p.status !== "selesai" &&
          p.status !== "tunda"
      )
      .forEach((p) => {
        list.push({
          date: p.deadline!,
          title: `Project: ${p.nama_project}`,
          type: "kanban",
          extra: `Divisi ${p.divisi}`,
        });
      });

    // 3. Produksi Video / Podcast aktif
    (produksiList || [])
      .filter(
        (p) =>
          (p.status === "pending_approval" ||
            p.status === "pending_pembina" ||
            p.status === "pending_ketua" ||
            p.status === "in_production") &&
          p.created_at
      )
      .slice(0, 3)
      .forEach((p) => {
        list.push({
          date: p.created_at.split("T")[0],
          title: `Produksi: ${p.judul}`,
          type: "produksi",
          extra: `${p.jenis?.toUpperCase() || "KONTEN"} · Status: ${p.status.replace(/_/g, " ")}`,
        });
      });

    // 4. Agenda Foto dan Kejuaraan Lomba dalam 7 hari
    (agendaFotoList || [])
      .filter((a) => {
        if (!a.tanggal) return false;
        const itemDate = a.tanggal.split("T")[0];
        return itemDate >= todayStr && itemDate <= nextWeekStr;
      })
      .forEach((a) => {
        const itemDate = a.tanggal.split("T")[0];
        list.push({
          date: itemDate,
          title: `Foto Kejuaraan: ${a.kejuaraan}`,
          type: "foto",
          extra: `Siswa: ${a.nama_siswa} (${a.kelas}) · Tingkat ${a.tingkat.toUpperCase()} · Status: ${
            a.status === "sudah" ? "Sudah Difoto" : "Belum Difoto"
          }`,
        });
      });

    return list.sort((a, b) => a.date.localeCompare(b.date));
  }, [prokerList, projectList, produksiList, agendaFotoList, todayStr, nextWeekStr]);

  return (
    <div className="p-5 rounded-2xl bg-surface-1 border border-studio-border-subtle space-y-3">
      {/* Header Widget: Murni View Saja (Tanpa Link ke Menu) */}
      <div className="flex items-center justify-between pb-3 border-b border-studio-border-subtle">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-spectrum-gold" />
          <h2 className="text-xs font-mono font-bold uppercase text-white tracking-wider">
            Agenda 1 Minggu ke Depan
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 text-studio-text-secondary border border-studio-border-subtle">
          {upcomingAgenda.length} Kegiatan Aktif
        </span>
      </div>

      {upcomingAgenda.length === 0 ? (
        <div className="py-6 text-center">
          <CalendarDays className="w-7 h-7 text-studio-text-muted mx-auto mb-1.5 opacity-40" />
          <p className="text-xs font-medium text-studio-text-secondary">
            Tidak ada agenda kegiatan dalam 1 minggu ke depan.
          </p>
          <p className="text-[10px] text-studio-text-muted font-mono mt-0.5">
            Semua jadwal dan tugas telah diselesaikan atau belum diagendakan.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {upcomingAgenda.map((item, idx) => {
            const typeColor =
              item.type === "proker"
                ? "text-spectrum-gold border-spectrum-gold/30 bg-spectrum-gold/10"
                : item.type === "kanban"
                ? "text-spectrum-cyan border-spectrum-cyan/30 bg-spectrum-cyan/10"
                : item.type === "foto"
                ? "text-spectrum-jade border-spectrum-jade/30 bg-spectrum-jade/10"
                : "text-orbital-magenta border-orbital-magenta/30 bg-orbital-magenta/10";
            const typeLabel =
              item.type === "proker"
                ? "PROKER"
                : item.type === "kanban"
                ? "KANBAN"
                : item.type === "foto"
                ? "AGENDA FOTO & LOMBA"
                : "PRODUKSI";

            const dateObj = new Date(item.date + "T00:00:00");
            const isToday = item.date === todayStr;

            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-2 border border-studio-border-subtle"
              >
                <div className="flex-shrink-0 text-center min-w-[42px] px-1 py-0.5 rounded-lg bg-surface-1 border border-studio-border-subtle">
                  <p
                    className={`text-[9px] font-mono font-bold ${
                      isToday ? "text-spectrum-amber" : "text-studio-text-muted"
                    }`}
                  >
                    {isToday
                      ? "HARI INI"
                      : dateObj.toLocaleDateString("id-ID", { weekday: "short" }).toUpperCase()}
                  </p>
                  <p
                    className={`text-sm font-bold ${
                      isToday ? "text-spectrum-amber" : "text-white"
                    }`}
                  >
                    {dateObj.getDate()}
                  </p>
                  <p className="text-[9px] font-mono text-studio-text-muted">
                    {dateObj.toLocaleDateString("id-ID", { month: "short" })}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${typeColor}`}
                    >
                      {item.type === "foto" && <Camera className="w-2.5 h-2.5 mr-1" />}
                      {typeLabel}
                    </span>
                    <span className="text-[10px] font-mono text-studio-text-muted">
                      {dateObj.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{item.title}</p>
                  {item.extra && (
                    <p className="text-[10px] text-studio-text-secondary font-mono mt-0.5 flex items-center gap-1">
                      {item.extra}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
