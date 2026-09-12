import React from "react";
import Image from "next/image";

interface KopSuratSpensaProps {
  subJudul?: string;
}

export function KopSuratSpensa({ subJudul = "LAPORAN PERTANGGUNGJAWABAN SEMESTER" }: KopSuratSpensaProps) {
  return (
    <div className="w-full text-slate-900 border-b-4 border-double border-slate-900 pb-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Emblem SMPN 1 Spensa */}
        <div className="w-20 h-20 relative flex-shrink-0 flex items-center justify-center p-1 bg-slate-100 rounded-full border border-slate-300">
          <div className="text-center">
            <span className="text-[9px] font-bold tracking-tighter block text-blue-900">SPENSA</span>
            <span className="text-[8px] font-mono text-slate-600 block">SMPN 1</span>
          </div>
        </div>

        {/* Center: Institutional Typography */}
        <div className="text-center flex-1">
          <h3 className="text-xs font-serif font-bold tracking-[0.18em] uppercase text-slate-700">
            PEMERINTAH KOTA · DINAS PENDIDIKAN DAN KEBUDAYAAN
          </h3>
          <h1 className="text-lg sm:text-xl font-serif font-extrabold tracking-[0.15em] text-blue-950 uppercase mt-0.5">
            SMP NEGERI 1 (SPENSA)
          </h1>
          <h2 className="text-xs font-serif font-bold tracking-widest text-slate-800 uppercase mt-0.5">
            UNIT KEGIATAN EKSTRAKURIKULER BROADCAST & MULTIMEDIA
          </h2>
          <p className="text-[10px] text-slate-600 mt-1 font-sans">
            Jl. Pendidikan No. 1 Spensa · Telp. (021) 555-SPENSA · Email: broadcast@spensa.sch.id
          </p>
        </div>

        {/* Right: Broadcast Spensa Logo */}
        <div className="w-20 h-20 relative flex-shrink-0 flex items-center justify-center">
          <Image
            src="/logo/BC_DONE.png"
            alt="Logo Resmi Broadcast Spensa"
            width={72}
            height={72}
            className="rounded-full object-cover shadow-sm"
          />
        </div>
      </div>
    </div>
  );
}
