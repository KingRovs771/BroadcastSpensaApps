-- =====================================================================
-- Broadcast Spensa OS v3.0.0
-- PERBAIKAN TOTAL: SUPABASE AUTH & SCHEMA HEALER
-- Jalankan kode ini di tab baru SQL Editor Supabase
-- =====================================================================

-- 1. HAPUS TRIGGER CUSTOM PADA AUTH.USERS (Penyebab utama Database error querying schema)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. PULIHKAN PERMISSION INTERNAL SUPABASE AUTH (GoTrue)
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO supabase_auth_admin;

-- 3. PULIHKAN PERMISSION SCHEMA PUBLIC
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role, supabase_auth_admin;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres, supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role, postgres, supabase_auth_admin;

-- 4. HAPUS RULE LAWAS PADA AUDIT LOG
DROP RULE IF EXISTS no_update_audit_log ON public.audit_log;
DROP RULE IF EXISTS no_delete_audit_log ON public.audit_log;

-- 5. PERMISSION INSERT PROFILE (Agar user login bisa membuat profil)
DROP POLICY IF EXISTS "Profiles insertable by authenticated" ON public.profiles;
CREATE POLICY "Profiles insertable by authenticated" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- 6. SEED DATA MASTER DIVISI
INSERT INTO public.divisi_ref (id, nama, deskripsi) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Kreatif', 'Penyusunan naskah video, script liputan, dan outline podcast.'),
    ('11111111-1111-1111-1111-111111111102', 'Presenter', 'Host podcast, pembawa acara live streaming, dan talent kamera.'),
    ('11111111-1111-1111-1111-111111111103', 'Fotografer', 'Dokumentasi visual, fotografi jurnalistik, dan liputan kejuaraan lomba.'),
    ('11111111-1111-1111-1111-111111111104', 'Videografer', 'Pengambilan gambar video, sinematografi, dan operator kamera studio.'),
    ('11111111-1111-1111-1111-111111111105', 'Broadcasting', 'Operator live stream switcher, audio mixer, dan sirkulasi aset inventaris.'),
    ('11111111-1111-1111-1111-111111111106', 'Editor', 'Post-processing video, color grading, audio master, dan visual effects.'),
    ('11111111-1111-1111-1111-111111111107', 'Promosi Digital', 'Distribusi konten, publikasi medsos, dan analitik performa views.')
ON CONFLICT (nama) DO NOTHING;

-- 7. SEED DATA KAS SETTINGS
INSERT INTO public.kas_settings (nominal, periode_type, effective_from) VALUES
    (2000, 'mingguan', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 8. RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
