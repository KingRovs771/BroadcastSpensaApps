import { describe, it, expect } from "vitest";
import { calculateKasSummary, getAnggotaTunggakan } from "../lib/utils/kas-calc";
import { KasPembayaran } from "../lib/mock/store";

describe("Kas Aggregation & Arrears Engine (PRD Modul 02 & AC-KAS-02)", () => {
  const sampleData: KasPembayaran[] = [
    { id: "1", anggota_id: "a1", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "W1", nominal: 5000, status: "lunas" },
    { id: "2", anggota_id: "a2", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "W1", nominal: 5000, status: "lunas" },
    { id: "3", anggota_id: "a3", periode_start: "2026-08-03", periode_end: "2026-08-09", periode_label: "W1", nominal: 5000, status: "belum" },
    { id: "4", anggota_id: "a3", periode_start: "2026-08-10", periode_end: "2026-08-16", periode_label: "W2", nominal: 5000, status: "belum" },
  ];

  it("Aggregates collected balance from lunas records only", () => {
    const summary = calculateKasSummary(sampleData);
    expect(summary.totalTerkumpul).toBe(10000);
    expect(summary.jumlahTransaksiLunas).toBe(2);
    expect(summary.totalTertunggak).toBe(10000);
    expect(summary.jumlahTransaksiTertunggak).toBe(2);
  });

  it("Filters arrears per member correctly", () => {
    const tunggakanA3 = getAnggotaTunggakan(sampleData, "a3");
    expect(tunggakanA3.length).toBe(2);
    expect(tunggakanA3.every((t) => t.status === "belum")).toBe(true);

    const tunggakanA1 = getAnggotaTunggakan(sampleData, "a1");
    expect(tunggakanA1.length).toBe(0);
  });
});
