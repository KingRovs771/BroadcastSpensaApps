import { z } from "zod";

export const absensiRecordSchema = z.object({
  anggota_id: z.string().uuid(),
  anggota_tipe: z.enum(["tetap", "ekskul"]),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pertemuan_ke: z.number().int().positive(),
  status: z.enum(["masuk", "izin", "sakit", "alpha"]),
  keterangan: z.string().optional(),
});

export const holidayDeclarationSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  alasan: z.string().min(5, "Alasan libur minimal 5 karakter"),
});
