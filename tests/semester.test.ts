import { describe, it, expect } from "vitest";
import { getAcademicSemester } from "../lib/utils/semester";

describe("Formula Semester & Academic Boundary (PRD Modul 04 & AGENTS.md Sec 5)", () => {
  it("AC-VIEW-02: Video rilis bulan Juli (7) masuk ke Semester Ganjil tahun ajaran baru (year/year+1)", () => {
    const result = getAcademicSemester("2026-07-04");
    expect(result.semester).toBe("ganjil");
    expect(result.tahunAjaran).toBe("2026/2027");
    expect(result.label).toBe("Semester Ganjil 2026/2027");
  });

  it("AC-VIEW-01: Video rilis bulan Desember (12) masuk ke Semester Genap tahun ajaran berjalan (year/year+1)", () => {
    const result = getAcademicSemester("2026-12-15");
    expect(result.semester).toBe("genap");
    expect(result.tahunAjaran).toBe("2026/2027");
    expect(result.label).toBe("Semester Genap 2026/2027");
  });

  it("Bulan Agustus - November (8-11) masuk ke Semester Ganjil normal (year/year+1)", () => {
    const sep = getAcademicSemester("2026-09-09");
    expect(sep.semester).toBe("ganjil");
    expect(sep.tahunAjaran).toBe("2026/2027");
    expect(sep.label).toBe("Semester Ganjil 2026/2027");

    const nov = getAcademicSemester("2026-11-20");
    expect(nov.semester).toBe("ganjil");
    expect(nov.tahunAjaran).toBe("2026/2027");
  });

  it("Bulan Januari - Juni (1-6) masuk ke Semester Genap normal (year-1/year)", () => {
    const mar = getAcademicSemester("2027-03-15");
    expect(mar.semester).toBe("genap");
    expect(mar.tahunAjaran).toBe("2026/2027");
    expect(mar.label).toBe("Semester Genap 2026/2027");

    const may = getAcademicSemester("2027-05-30");
    expect(may.semester).toBe("genap");
    expect(may.tahunAjaran).toBe("2026/2027");
  });
});
