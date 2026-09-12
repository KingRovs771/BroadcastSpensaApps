-- =====================================================================
-- Broadcast Spensa OS v3.0.0
-- Master Seed & Initial Admin Setup (Clean & Safe)
-- =====================================================================

-- 0. Bersihkan trigger lama jika ada yang membuat error schema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 1. MASTER DIVISI
INSERT INTO public.divisi_ref (id, nama, deskripsi) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Kreatif', 'Penyusunan naskah video, script liputan, dan outline podcast.'),
    ('11111111-1111-1111-1111-111111111102', 'Presenter', 'Host podcast, pembawa acara live streaming, dan talent kamera.'),
    ('11111111-1111-1111-1111-111111111103', 'Fotografer', 'Dokumentasi visual, fotografi jurnalistik, dan liputan kejuaraan lomba.'),
    ('11111111-1111-1111-1111-111111111104', 'Videografer', 'Pengambilan gambar video, sinematografi, dan operator kamera studio.'),
    ('11111111-1111-1111-1111-111111111105', 'Broadcasting', 'Operator live stream switcher, audio mixer, dan sirkulasi aset inventaris.'),
    ('11111111-1111-1111-1111-111111111106', 'Editor', 'Post-processing video, color grading, audio master, dan visual effects.'),
    ('11111111-1111-1111-1111-111111111107', 'Promosi Digital', 'Distribusi konten, publikasi medsos, dan analitik performa views.')
ON CONFLICT (nama) DO NOTHING;

-- 2. INITIAL KAS SETTINGS
INSERT INTO public.kas_settings (nominal, periode_type, effective_from) VALUES
    (2000, 'mingguan', CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- 3. PERMISSION INSERT PROFILE (Agar user yang login bisa melengkapi profilnya sendiri)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Profiles insertable by authenticated'
    ) THEN
        CREATE POLICY "Profiles insertable by authenticated" 
        ON public.profiles FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 4. SINKRONISASI SEMUA USER DI AUTH.USERS KE PUBLIC.PROFILES
-- (Setiap user yang sudah dibuat di menu Authentication otomatis menjadi administrator)
INSERT INTO public.profiles (id, nama, email, role, divisi)
SELECT 
    id,
    COALESCE(raw_user_meta_data->>'nama', split_part(email, '@', 1), 'Administrator'),
    email,
    'administrator',
    NULL
FROM auth.users
ON CONFLICT (id) DO UPDATE 
SET role = 'administrator';
