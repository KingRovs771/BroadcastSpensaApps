import { z } from "zod";

export const DIVISI_OPTIONS = [
  "Kreatif",
  "Presenter",
  "Fotografer",
  "Videografer",
  "Broadcasting",
  "Editor",
  "Promosi Digital",
] as const;

export const PRODUKSI_JENIS_OPTIONS = [
  "podcast",
  "video",
  "liputan",
  "live",
] as const;

export const PRODUKSI_STATUS_OPTIONS = [
  "pending_approval",
  "pending_pembina",
  "pending_ketua",
  "approved",
  "rejected",
  "in_production",
  "pending_divisi",
  "done",
  "published",
] as const;

export const produksiUploadSchema = z
  .object({
    judul: z.string().min(5, "Judul minimal 5 karakter").max(200),
    jenis: z.enum(PRODUKSI_JENIS_OPTIONS),
    divisi: z.enum(DIVISI_OPTIONS),
    script_text: z.string().optional(),
    pertanyaan_podcast: z.string().optional(),
  })
  .refine(
    (data) => {
      const hasScript = data.script_text && data.script_text.trim().length >= 50;
      const hasPodcast =
        data.pertanyaan_podcast &&
        data.pertanyaan_podcast.split("\n").filter((l) => l.trim().length > 0)
          .length >= 3;
      return hasScript || hasPodcast;
    },
    {
      message:
        "Wajib mengisi script (minimal 50 karakter) ATAU pertanyaan podcast (minimal 3 butir)",
      path: ["script_text"],
    }
  );

export const produksiLinkSchema = z.object({
  thumbnail_url: z.string().url("URL thumbnail tidak valid").optional().or(z.literal("")),
  video_url: z.string().url("URL video tidak valid").optional().or(z.literal("")),
  audio_url: z.string().url("URL audio tidak valid").optional().or(z.literal("")),
});

export const produksiApprovalSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  catatan: z.string().optional(),
});
