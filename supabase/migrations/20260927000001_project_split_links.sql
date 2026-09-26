-- =====================================================================
-- Migration: Pisah link_drive menjadi 4 kolom link produksi terpisah
-- Tabel   : public.project
-- Tanggal : 2026-09-27
-- =====================================================================

-- 1. Tambah 4 kolom link produksi baru (nullable, bisa diisi kapan saja)
ALTER TABLE public.project
  ADD COLUMN IF NOT EXISTS link_video     TEXT,
  ADD COLUMN IF NOT EXISTS link_audio     TEXT,
  ADD COLUMN IF NOT EXISTS link_thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS link_finalisasi TEXT;

-- 2. (Opsional) Migrasi data lama: salin link_drive ke link_video
UPDATE public.project
SET link_video = link_drive
WHERE link_drive IS NOT NULL AND link_video IS NULL;

-- 3. Hapus kolom lama link_drive
ALTER TABLE public.project
  DROP COLUMN IF EXISTS link_drive;
