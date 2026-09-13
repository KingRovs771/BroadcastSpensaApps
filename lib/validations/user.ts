import { z } from "zod";

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
