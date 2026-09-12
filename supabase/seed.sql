-- =====================================================================
-- Broadcast Spensa OS v3.0.0
-- PERBAIKAN PERMISSION SCHEMA PUBLIC & MASTER SEED
-- =====================================================================

-- 1. KEMBALIKAN PERMISSION SCHEMA PUBLIC (Mengatasi Query Database Schema Error)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role, postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role, postgres;

-- 2. HAPUS RULE LAWAS JIKA ADA
DROP RULE IF EXISTS no_update_audit_log ON public.audit_log;
DROP RULE IF EXISTS no_delete_audit_log ON public.audit_log;

-- 3. MASTER DIVISI
INSERT INTO public.divisi_ref (id, nama, deskripsi) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Kreatif', 'Penyusunan naskah video, script liputan, dan outline podcast.'),
    ('11111111-1111-1111-1111-111111111102', 'Presenter', 'Host podcast, pembawa acara live streaming, dan talent kamera.'),
    ('11111111-1111-1111-1111-111111111103', 'Fotografer', 'Dokumentasi visual, fotografi jurnalistik, dan liputan kejuaraan lomba.'),
    ('11111111-1111-1111-1111-111111111104', 'Videografer', 'Pengambilan gambar video, sinematografi, dan operator kamera studio.'),
    ('11111111-1111-1111-1111-111111111105', 'Broadcasting', 'Operator live stream switcher, audio mixer, dan sirkulasi aset inventaris.'),
    ('11111111-1111-1111-1111-111111111106', 'Editor', 'Post-processing video, color grading, audio master, dan visual effects.'),
    ('11111111-1111-1111-1111-111111111107', 'Promosi Digital', 'Distribusi konten, publikasi medsos, dan analitik performa views.')
ON CONFLICT (nama) DO NOTHING;

-- 4. INITIAL KAS SETTINGS
INSERT INTO public.kas_settings (nominal, periode_type, effective_from) VALUES
    (2000, 'mingguan', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 5. PERMISSION INSERT PROFILE (Agar user login bisa auto-create profil)
DROP POLICY IF EXISTS "Profiles insertable by authenticated" ON public.profiles;
CREATE POLICY "Profiles insertable by authenticated" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 6. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
