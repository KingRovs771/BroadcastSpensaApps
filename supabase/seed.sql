-- =====================================================================
-- Broadcast Spensa OS v3.0.0
-- Master Divisions and Default Seed Data
-- =====================================================================

-- 1. Insert Divisions
INSERT INTO public.divisi_ref (id, nama, deskripsi) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Kreatif', 'Penyusunan naskah video, script liputan, dan outline podcast.'),
    ('11111111-1111-1111-1111-111111111102', 'Presenter', 'Host podcast, pembawa acara live streaming, dan talent kamera.'),
    ('11111111-1111-1111-1111-111111111103', 'Fotografer', 'Dokumentasi visual, fotografi jurnalistik, dan liputan kejuaraan lomba.'),
    ('11111111-1111-1111-1111-111111111104', 'Videografer', 'Pengambilan gambar video, sinematografi, dan operator kamera studio.'),
    ('11111111-1111-1111-1111-111111111105', 'Broadcasting', 'Operator live stream switcher, audio mixer, dan sirkulasi aset inventaris.'),
    ('11111111-1111-1111-1111-111111111106', 'Editor', 'Post-processing video, color grading, audio master, dan visual effects.'),
    ('11111111-1111-1111-1111-111111111107', 'Promosi Digital', 'Distribusi konten, publikasi medsos, dan analitik performa views.')
ON CONFLICT (nama) DO NOTHING;

-- 2. Initial Kas Settings
INSERT INTO public.kas_settings (nominal, periode_type, effective_from) VALUES
    (5000, 'mingguan', CURRENT_DATE);
