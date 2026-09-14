import { describe, it, expect } from "vitest";
import { updateUserSchema, deleteUserSchema, USER_ROLES, USER_DIVISI } from "../lib/validations/user";

describe("user-crud (User CRUD Validation & Business Rules)", () => {
  it("updateUserSchema berhasil memvalidasi pembaruan profil yang sah", () => {
    const validData = {
      targetUserId: "29743d30-39ab-4a47-8898-c991ee0f8e5b",
      nama: "Kinan Putra",
      role: "ketua_divisi" as const,
      divisi: "Videografer" as const,
    };

    const result = updateUserSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.nama).toBe("Kinan Putra");
      expect(result.data.role).toBe("ketua_divisi");
      expect(result.data.divisi).toBe("Videografer");
    }
  });

  it("updateUserSchema menolak nama kosong atau terlalu pendek", () => {
    const invalidData = {
      targetUserId: "29743d30-39ab-4a47-8898-c991ee0f8e5b",
      nama: "A",
      role: "ketua_divisi",
      divisi: "Videografer",
    };

    const result = updateUserSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("updateUserSchema menolak role yang tidak dikenal", () => {
    const invalidData = {
      targetUserId: "29743d30-39ab-4a47-8898-c991ee0f8e5b",
      nama: "Kinan",
      role: "super_admin_palsu",
    };

    const result = updateUserSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("deleteUserSchema memerlukan targetUserId yang valid", () => {
    const validDelete = { targetUserId: "ae3d20b3-5101-476b-9892-19b1a580fe07" };
    expect(deleteUserSchema.safeParse(validDelete).success).toBe(true);

    const emptyDelete = { targetUserId: "" };
    expect(deleteUserSchema.safeParse(emptyDelete).success).toBe(false);
  });

  it("Daftar USER_ROLES mencakup 9 peran resmi Studio Broadcast Spensa OS", () => {
    expect(USER_ROLES).toContain("administrator");
    expect(USER_ROLES).toContain("pembina");
    expect(USER_ROLES).toContain("ketua_broadcast");
    expect(USER_ROLES).toContain("ketua_divisi");
    expect(USER_ROLES).toContain("sekretaris");
    expect(USER_ROLES).toContain("bendahara");
    expect(USER_ROLES).toContain("div_kreatif");
    expect(USER_ROLES).toContain("pj");
    expect(USER_ROLES).toContain("anggota");
    expect(USER_ROLES.length).toBe(9);
  });

  it("Daftar USER_DIVISI mencakup 7 divisi resmi", () => {
    expect(USER_DIVISI).toEqual([
      "Kreatif",
      "Presenter",
      "Fotografer",
      "Videografer",
      "Broadcasting",
      "Editor",
      "Promosi Digital",
    ]);
  });
});
