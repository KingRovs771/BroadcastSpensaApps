import { describe, it, expect } from "vitest";
import { ALL_NAV_ITEMS, isRouteAllowedForUser } from "../lib/utils/nav-permissions";

describe("nav-permissions (RBAC Navigation Filters)", () => {
  it("Sekretaris hanya melihat menu administrasi dan laporan resmi (tanpa kas, kanban, foto, inventaris)", () => {
    const sekretarisMenus = ALL_NAV_ITEMS.filter((item) =>
      isRouteAllowedForUser(item, "sekretaris")
    ).map((item) => item.label);

    expect(sekretarisMenus).toEqual([
      "Dashboard",
      "Absensi Mingguan",
      "Notulen Rapat",
      "Data Anggota",
      "Laporan Semester",
    ]);

    // Pastikan menu yang tidak relevan tidak muncul
    expect(sekretarisMenus).not.toContain("Buku Kas Anggota");
    expect(sekretarisMenus).not.toContain("Project Kanban");
    expect(sekretarisMenus).not.toContain("Agenda Foto / Lomba");
    expect(sekretarisMenus).not.toContain("Inventaris Aset");
    expect(sekretarisMenus).not.toContain("Produksi Dual-Gate");
    expect(sekretarisMenus).not.toContain("Keuangan Pembina");
  });

  it("Bendahara hanya melihat menu keuangan dan data anggota", () => {
    const bendaharaMenus = ALL_NAV_ITEMS.filter((item) =>
      isRouteAllowedForUser(item, "bendahara")
    ).map((item) => item.label);

    expect(bendaharaMenus).toEqual([
      "Dashboard",
      "Buku Kas Anggota",
      "Keuangan Pembina",
      "Data Anggota",
    ]);

    expect(bendaharaMenus).not.toContain("Absensi Mingguan");
    expect(bendaharaMenus).not.toContain("Notulen Rapat");
    expect(bendaharaMenus).not.toContain("Produksi Dual-Gate");
    expect(bendaharaMenus).not.toContain("Laporan Semester");
  });

  it("Divisi Kreatif hanya melihat Dashboard, Produksi Dual-Gate, dan Project Kanban", () => {
    const kreatifMenus = ALL_NAV_ITEMS.filter((item) =>
      isRouteAllowedForUser(item, "div_kreatif", "Kreatif")
    ).map((item) => item.label);

    expect(kreatifMenus).toEqual([
      "Dashboard",
      "Produksi Dual-Gate",
      "Project Kanban",
    ]);
  });

  it("Ketua Divisi Fotografer dapat melihat Agenda Foto, tetapi tidak melihat Inventaris Aset", () => {
    const fotoMenus = ALL_NAV_ITEMS.filter((item) =>
      isRouteAllowedForUser(item, "ketua_divisi", "Fotografer")
    ).map((item) => item.label);

    expect(fotoMenus).toContain("Agenda Foto / Lomba");
    expect(fotoMenus).not.toContain("Inventaris Aset");
    expect(fotoMenus).not.toContain("Buku Kas Anggota");
    expect(fotoMenus).not.toContain("Absensi Mingguan");
  });

  it("Ketua Divisi Broadcasting dapat melihat Inventaris Aset, tetapi tidak melihat Agenda Foto", () => {
    const bcMenus = ALL_NAV_ITEMS.filter((item) =>
      isRouteAllowedForUser(item, "ketua_divisi", "Broadcasting")
    ).map((item) => item.label);

    expect(bcMenus).toContain("Inventaris Aset");
    expect(bcMenus).not.toContain("Agenda Foto / Lomba");
    expect(bcMenus).not.toContain("Buku Kas Anggota");
  });

  it("Administrator melihat seluruh 12 menu sistem termasuk Audit Log Sistem", () => {
    const adminMenus = ALL_NAV_ITEMS.filter((item) =>
      isRouteAllowedForUser(item, "administrator")
    ).map((item) => item.label);

    expect(adminMenus.length).toBe(12);
    expect(adminMenus).toContain("Keuangan Pembina");
    expect(adminMenus).toContain("Produksi Dual-Gate");
    expect(adminMenus).toContain("Laporan Semester");
    expect(adminMenus).toContain("Audit Log Sistem");
  });

  it("Role non-administrator tidak dapat melihat menu Audit Log Sistem", () => {
    const nonAdminRoles = [
      "pembina",
      "ketua_broadcast",
      "ketua_divisi",
      "sekretaris",
      "bendahara",
      "div_kreatif",
      "pj",
      "anggota",
    ] as const;

    for (const role of nonAdminRoles) {
      const menus = ALL_NAV_ITEMS.filter((item) =>
        isRouteAllowedForUser(item, role)
      ).map((item) => item.label);

      expect(menus).not.toContain("Audit Log Sistem");
    }
  });
});
