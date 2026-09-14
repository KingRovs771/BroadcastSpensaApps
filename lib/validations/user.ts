import { z } from "zod";

export const USER_ROLES = [
  "administrator",
  "pembina",
  "ketua_broadcast",
  "ketua_divisi",
  "sekretaris",
  "bendahara",
  "div_kreatif",
  "pj",
  "anggota",
] as const;

export const USER_DIVISI = [
  "Kreatif",
  "Presenter",
  "Fotografer",
  "Videografer",
  "Broadcasting",
  "Editor",
  "Promosi Digital",
] as const;

export const resetPasswordSchema = z.object({
  userId: z.string().min(1, "User ID wajib disertakan"),
  email: z.string().email("Format email tidak valid"),
  newPassword: z
    .string()
    .min(6, "Kata sandi minimal 6 karakter")
    .optional(),
  mode: z.enum(["direct", "email"]),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateUserSchema = z.object({
  targetUserId: z.string().min(1, "User ID wajib disertakan"),
  nama: z.string().min(2, "Nama minimal 2 karakter"),
  role: z.enum(USER_ROLES),
  divisi: z.enum(USER_DIVISI).optional().nullable(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const deleteUserSchema = z.object({
  targetUserId: z.string().min(1, "User ID target wajib disertakan"),
});

export type DeleteUserInput = z.infer<typeof deleteUserSchema>;
