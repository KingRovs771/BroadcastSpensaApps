import { z } from "zod";

export const kasSettingsSchema = z.object({
  nominal: z.number().int().positive("Nominal harus lebih dari 0"),
  periode_type: z.enum(["mingguan", "dwimingguan"]),
  effective_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD"),
});

export const kasBayarSchema = z.object({
  pembayaran_id: z.string().uuid(),
  status: z.enum(["lunas", "belum"]),
});
