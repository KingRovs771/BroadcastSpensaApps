-- Migration: 20261003000001_proker_table.sql
-- Tabel Program Kerja (Proker) untuk Broadcast Club Spensa
-- Role yang boleh Create/Update/Delete: administrator, pembina, ketua_broadcast, sekretaris, bendahara

CREATE TABLE IF NOT EXISTS public.proker (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_kegiatan    TEXT NOT NULL,
    tanggal          DATE NOT NULL,
    waktu            TEXT,                -- contoh: "08.00 - 10.00 WIB"
    lokasi           TEXT,
    penanggung_jawab TEXT,                -- nama PJ (free text)
    deskripsi        TEXT,
    status           TEXT NOT NULL DEFAULT 'terjadwal'
                     CHECK (status IN ('terjadwal', 'selesai', 'dibatalkan')),
    dibuat_oleh      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.proker ENABLE ROW LEVEL SECURITY;

-- Semua authenticated user boleh membaca
CREATE POLICY "Proker viewable by all authenticated"
ON public.proker FOR SELECT
TO authenticated USING (true);

-- Hanya role privileged yang boleh INSERT
CREATE POLICY "Proker insert by privileged roles"
ON public.proker FOR INSERT
TO authenticated
WITH CHECK (
    public.get_current_role() IN ('administrator', 'pembina', 'ketua_broadcast', 'sekretaris', 'bendahara')
);

-- Hanya role privileged yang boleh UPDATE
CREATE POLICY "Proker update by privileged roles"
ON public.proker FOR UPDATE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'pembina', 'ketua_broadcast', 'sekretaris', 'bendahara')
);

-- Hanya role privileged yang boleh DELETE
CREATE POLICY "Proker delete by privileged roles"
ON public.proker FOR DELETE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'pembina', 'ketua_broadcast', 'sekretaris', 'bendahara')
);

-- Index untuk query dashboard (kegiatan 1 minggu ke depan)
CREATE INDEX IF NOT EXISTS idx_proker_tanggal ON public.proker(tanggal);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_proker_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_proker_updated_at
    BEFORE UPDATE ON public.proker
    FOR EACH ROW EXECUTE FUNCTION public.set_proker_updated_at();
