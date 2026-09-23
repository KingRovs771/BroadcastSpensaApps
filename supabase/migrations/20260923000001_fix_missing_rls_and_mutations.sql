-- =====================================================================
-- Migration: 20260923000001_fix_missing_rls_and_mutations.sql
-- Fix Missing RLS Policies on divisi_ref, inventaris_peminjaman, laporan_arsip
-- And provide automated helper for Kas Periods & Division Seeding
-- =====================================================================

-- 1. divisi_ref RLS Policies
DROP POLICY IF EXISTS "Divisi viewable by all" ON public.divisi_ref;
DROP POLICY IF EXISTS "Divisi editable by admin" ON public.divisi_ref;

CREATE POLICY "Divisi viewable by all"
ON public.divisi_ref FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Divisi editable by admin"
ON public.divisi_ref FOR ALL
TO authenticated
USING (public.get_current_role() IN ('administrator', 'pembina', 'sekretaris'));

-- 2. inventaris_peminjaman RLS Policies
DROP POLICY IF EXISTS "Inventaris peminjaman viewable by all" ON public.inventaris_peminjaman;
DROP POLICY IF EXISTS "Inventaris peminjaman editable by all" ON public.inventaris_peminjaman;

CREATE POLICY "Inventaris peminjaman viewable by all"
ON public.inventaris_peminjaman FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Inventaris peminjaman editable by all"
ON public.inventaris_peminjaman FOR ALL
TO authenticated
USING (true);

-- 3. laporan_arsip RLS Policies
DROP POLICY IF EXISTS "Laporan arsip viewable by authenticated" ON public.laporan_arsip;
DROP POLICY IF EXISTS "Laporan arsip editable by privileged" ON public.laporan_arsip;

CREATE POLICY "Laporan arsip viewable by authenticated"
ON public.laporan_arsip FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Laporan arsip editable by privileged"
ON public.laporan_arsip FOR ALL
TO authenticated
USING (public.get_current_role() IN ('administrator', 'pembina', 'sekretaris', 'ketua_broadcast'));

-- 4. Seed divisi_ref safely if empty
INSERT INTO public.divisi_ref (id, nama, deskripsi) VALUES
    ('11111111-1111-1111-1111-111111111101', 'Kreatif', 'Penyusunan naskah video, script liputan, dan outline podcast.'),
    ('11111111-1111-1111-1111-111111111102', 'Presenter', 'Host podcast, pembawa acara live streaming, dan talent kamera.'),
    ('11111111-1111-1111-1111-111111111103', 'Fotografer', 'Dokumentasi visual, fotografi jurnalistik, dan liputan kejuaraan lomba.'),
    ('11111111-1111-1111-1111-111111111104', 'Videografer', 'Pengambilan gambar video, sinematografi, dan operator kamera studio.'),
    ('11111111-1111-1111-1111-111111111105', 'Broadcasting', 'Operator live stream switcher, audio mixer, dan sirkulasi aset inventaris.'),
    ('11111111-1111-1111-1111-111111111106', 'Editor', 'Post-processing video, color grading, audio master, dan visual effects.'),
    ('11111111-1111-1111-1111-111111111107', 'Promosi Digital', 'Distribusi konten, publikasi medsos, dan analitik performa views.')
ON CONFLICT (nama) DO UPDATE
SET deskripsi = EXCLUDED.deskripsi;

-- Hubungkan ketua_id di divisi_ref ke akun Ketua Divisi yang sesuai
UPDATE public.divisi_ref d
SET ketua_id = p.id
FROM public.profiles p
WHERE p.role = 'ketua_divisi' AND p.divisi = d.nama;

-- 5. RPC untuk Inisiasi Pekan Kas Otomatis bagi Semua Anggota Aktif
CREATE OR REPLACE FUNCTION public.init_kas_periods_for_active_members(
    p_bulan_label TEXT DEFAULT 'Sep 2026',
    p_nominal INT DEFAULT 2000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_anggota RECORD;
    v_pekan INT;
    v_inserted INT := 0;
    v_start_date DATE;
    v_end_date DATE;
    v_label TEXT;
BEGIN
    FOR v_anggota IN SELECT id, nama_lengkap FROM public.anggota WHERE status = 'aktif' LOOP
        FOR v_pekan IN 1..4 LOOP
            v_label := 'Minggu ' || v_pekan || ' (' || p_bulan_label || ')';
            v_start_date := CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INT) + ((v_pekan - 1) * 7);
            v_end_date := v_start_date + 6;

            INSERT INTO public.kas_pembayaran (
                anggota_id,
                periode_start,
                periode_end,
                periode_label,
                nominal,
                status
            ) VALUES (
                v_anggota.id,
                v_start_date,
                v_end_date,
                v_label,
                p_nominal,
                'belum'
            ) ON CONFLICT (anggota_id, periode_start) DO NOTHING;

            v_inserted := v_inserted + 1;
        END LOOP;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Berhasil menginisiasi pekan kas untuk anggota aktif.',
        'total_pekan_generated', v_inserted
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.init_kas_periods_for_active_members(TEXT, INT) TO anon, authenticated, service_role;
