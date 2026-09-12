import { z } from "zod";
import { DIVISI_OPTIONS } from "./produksi";

export const projectCreateSchema = z.object({
  nama_project: z.string().min(5, "Nama project minimal 5 karakter").max(200),
  deskripsi: z.string().optional(),
  penanggung_jawab: z.string().min(1, "Penanggung jawab wajib dipilih"),
  tim: z.array(z.string()).default([]),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal YYYY-MM-DD").optional().or(z.literal("")),
  status: z.enum(["perencanaan", "proses", "selesai", "tunda"]).default("perencanaan"),
  progress: z.number().min(0).max(100).default(0),
  link_drive: z
    .string()
    .regex(/^https:\/\/drive\.google\.com\/.*/, "Link Drive harus diawali dengan https://drive.google.com/")
    .optional()
    .or(z.literal("")),
  divisi: z.enum(DIVISI_OPTIONS),
});
