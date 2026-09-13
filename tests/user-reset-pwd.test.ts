import { describe, it, expect } from "vitest";
import { resetPasswordSchema } from "../lib/validations/user";

describe("resetPasswordSchema (Zod Validation)", () => {
  it("harus meloloskan payload direct reset yang valid", () => {
    const validDirect = {
      userId: "usr-admin",
      email: "admin@spensa.sch.id",
      newPassword: "Password123!",
      mode: "direct",
    };

    const result = resetPasswordSchema.safeParse(validDirect);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userId).toBe("usr-admin");
      expect(result.data.mode).toBe("direct");
      expect(result.data.newPassword).toBe("Password123!");
    }
  });

  it("harus menolak kata sandi kurang dari 6 karakter pada mode direct", () => {
    const invalidPwd = {
      userId: "usr-pembina",
      email: "pembina@spensa.sch.id",
      newPassword: "123",
      mode: "direct",
    };

    const result = resetPasswordSchema.safeParse(invalidPwd);
    expect(result.success).toBe(false);
  });

  it("harus meloloskan mode email tanpa newPassword", () => {
    const validEmailMode = {
      userId: "usr-siswa-1",
      email: "siswa@spensa.sch.id",
      mode: "email",
    };

    const result = resetPasswordSchema.safeParse(validEmailMode);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.mode).toBe("email");
      expect(result.data.newPassword).toBeUndefined();
    }
  });

  it("harus menolak format email yang salah", () => {
    const invalidEmail = {
      userId: "usr-123",
      email: "bukan-email",
      newPassword: "ValidPassword123!",
      mode: "direct",
    };

    const result = resetPasswordSchema.safeParse(invalidEmail);
    expect(result.success).toBe(false);
  });

  it("harus menolak bila userId kosong", () => {
    const missingUserId = {
      userId: "",
      email: "test@spensa.sch.id",
      mode: "email",
    };

    const result = resetPasswordSchema.safeParse(missingUserId);
    expect(result.success).toBe(false);
  });
});
