import React from "react";

interface KopSuratSpensaProps {
  subJudul?: string;
}

/**
 * Kop Surat Resmi Broadcast Spensa — SMP Negeri 1 Sragen
 * ────────────────────────────────────────────────────────
 * Logo boleh menggunakan <img> (sekolah & broadcast).
 * Semua teks murni HTML/CSS (tidak ada gambar teks).
 * Warna & garis sesuai standar dokumen resmi kedinasan.
 */
export function KopSuratSpensa({ subJudul }: KopSuratSpensaProps) {
  return (
    <div className="w-full text-slate-900">
      {/* ── Baris utama kop: logo kiri | teks tengah | logo kanan ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          paddingBottom: "8px",
        }}
      >
        {/* Logo Sekolah (kiri) */}
        <div style={{ flexShrink: 0, width: 72, height: 72 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/school_logo.png"
            alt="Logo SMP Negeri 1 Sragen"
            width={72}
            height={72}
            style={{ objectFit: "contain", borderRadius: "50%" }}
            onError={(e) => {
              // fallback: lingkaran teks jika gambar tidak ada
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* Teks Institusi (tengah) */}
        <div style={{ flex: 1, textAlign: "center" }}>
          {/* Nama Sekolah */}
          <p
            style={{
              fontFamily: "serif",
              fontWeight: 700,
              fontSize: "18px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#1e293b",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            CLUB BROADCAST
          </p>
          <p
            style={{
              fontFamily: "serif",
              fontWeight: 900,
              fontSize: "18px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#1e293b",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            SMP NEGERI 1 SRAGEN
          </p>
          {/* Alamat & Kontak */}
          <p
            style={{
              fontFamily: "sans-serif",
              fontSize: "10px",
              color: "#475569",
              margin: "2px 0 0",
              lineHeight: 1.5,
              textDecoration: "underline",
            }}
          >
            Jln Raya Sukowati No. 162&nbsp;&nbsp;Telp./Fax. (0271) 891030 Sragen &ndash; 57212
          </p>
          <p
            style={{
              fontFamily: "sans-serif",
              fontSize: "10px",
              color: "#475569",
              margin: 0,
              lineHeight: 1.5,
              textDecoration: "underline",
            }}
          >
            Website: www.smpn1sragen.sch.id, e-mail: info@smpn1sragen.sch.id&nbsp;&nbsp;Akreditasi: 95 (A)
          </p>
        </div>

        {/* Logo Broadcast (kanan) */}
        <div style={{ flexShrink: 0, width: 72, height: 72 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/BC_DONE.png"
            alt="Logo Broadcast Spensa"
            width={72}
            height={72}
            style={{ objectFit: "contain", borderRadius: "50%" }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      </div>

      {/* ── Garis Pemisah Tebal (standar kop resmi) ── */}
      <div
        style={{
          borderTop: "4px solid #0f172a",
          borderBottom: "1px solid #0f172a",
          height: 0,
          marginBottom: "16px",
        }}
      />

      {/* Sub-judul dokumen (opsional) */}
      {subJudul && (
        <p
          style={{
            fontFamily: "serif",
            fontWeight: 700,
            fontSize: "12px",
            textTransform: "uppercase",
            textAlign: "center",
            letterSpacing: "0.12em",
            color: "#1e293b",
            marginBottom: "8px",
          }}
        >
          {subJudul}
        </p>
      )}
    </div>
  );
}
