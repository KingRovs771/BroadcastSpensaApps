-- =====================================================================
-- Migration: 20260914000002_fix_delete_user_rpc.sql
-- Direct Admin User Deletion RPC and Cascade Safeguard for Supabase
-- =====================================================================

CREATE OR REPLACE FUNCTION public.admin_delete_user(target_identifier TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_actor_role TEXT;
    v_target_email TEXT;
    v_target_nama TEXT;
BEGIN
    -- 1. Validasi hak akses: Hanya Administrator dan Pembina yang berhak menghapus
    SELECT role INTO v_actor_role FROM public.profiles WHERE id = auth.uid();
    
    IF auth.uid() IS NOT NULL AND (v_actor_role IS NULL OR v_actor_role NOT IN ('administrator', 'pembina')) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Akses ditolak: Hanya Administrator atau Dewan Pembina yang berhak menghapus akun pengguna.'
        );
    END IF;

    -- 2. Cari target user ID & email
    IF target_identifier ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_user_id := target_identifier::UUID;
        SELECT email, nama INTO v_target_email, v_target_nama FROM public.profiles WHERE id = v_user_id;
    ELSE
        SELECT id, email, nama INTO v_user_id, v_target_email, v_target_nama 
        FROM public.profiles 
        WHERE lower(email) = lower(trim(target_identifier))
        LIMIT 1;
        
        IF v_user_id IS NULL THEN
            SELECT id, email INTO v_user_id, v_target_email
            FROM auth.users
            WHERE lower(email) = lower(trim(target_identifier))
            LIMIT 1;
        END IF;
    END IF;

    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Pengguna tidak ditemukan dalam sistem database.'
        );
    END IF;

    -- Cegah hapus diri sendiri jika user sedang login
    IF auth.uid() IS NOT NULL AND auth.uid() = v_user_id THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.'
        );
    END IF;

    -- 3. Lepaskan / detach seluruh foreign key constraints sebelum menghapus
    -- a. Master Divisi
    UPDATE public.divisi_ref SET ketua_id = NULL WHERE ketua_id = v_user_id;
    
    -- b. Absensi
    UPDATE public.absensi SET libur_oleh = NULL WHERE libur_oleh = v_user_id;
    UPDATE public.absensi SET dicatat_oleh = NULL WHERE dicatat_oleh = v_user_id;
    
    -- c. Kas
    UPDATE public.kas_settings SET diatur_oleh = NULL WHERE diatur_oleh = v_user_id;
    UPDATE public.kas_pembayaran SET dicatat_oleh = NULL WHERE dicatat_oleh = v_user_id;
    
    -- d. Keuangan Pembina
    UPDATE public.keuangan_pembina SET created_by = NULL WHERE created_by = v_user_id;
    
    -- e. Notulen Rapat
    UPDATE public.notulen SET dibuat_oleh = NULL WHERE dibuat_oleh = v_user_id;
    UPDATE public.notulen SET disetujui_oleh = NULL WHERE disetujui_oleh = v_user_id;
    
    -- f. Agenda Foto / Prestasi
    UPDATE public.agenda_foto SET dibuat_oleh = NULL WHERE dibuat_oleh = v_user_id;
    UPDATE public.agenda_foto SET diupdate_oleh = NULL WHERE diupdate_oleh = v_user_id;
    
    -- g. Inventaris & Peminjaman
    UPDATE public.inventaris SET penanggung_jawab = NULL WHERE penanggung_jawab = v_user_id;
    UPDATE public.inventaris_peminjaman SET dicatat_oleh = NULL WHERE dicatat_oleh = v_user_id;
    
    -- h. Laporan Arsip
    UPDATE public.laporan_arsip SET generated_by = NULL WHERE generated_by = v_user_id;
    
    -- i. Project (kolom penanggung_jawab NOT NULL, reassign ke admin atau auth.uid())
    UPDATE public.project 
    SET penanggung_jawab = COALESCE(auth.uid(), (SELECT id FROM public.profiles WHERE role = 'administrator' LIMIT 1))
    WHERE penanggung_jawab = v_user_id;
    
    -- j. Produksi Video (kolom uploaded_by NOT NULL, reassign ke admin atau auth.uid())
    UPDATE public.produksi_video
    SET uploaded_by = COALESCE(auth.uid(), (SELECT id FROM public.profiles WHERE role = 'administrator' LIMIT 1))
    WHERE uploaded_by = v_user_id;
    
    UPDATE public.produksi_video SET approved_pembina_by = NULL WHERE approved_pembina_by = v_user_id;
    UPDATE public.produksi_video SET approved_ketua_by = NULL WHERE approved_ketua_by = v_user_id;
    UPDATE public.produksi_video SET penanggung_jawab_id = NULL WHERE penanggung_jawab_id = v_user_id;

    -- 4. Hapus dari public.profiles
    DELETE FROM public.profiles WHERE id = v_user_id;

    -- 5. Hapus dari auth.users (menghapus autentikasi permanen)
    DELETE FROM auth.users WHERE id = v_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Akun ' || COALESCE(v_target_nama, v_target_email, 'pengguna') || ' berhasil dihapus permanen dari sistem.',
        'user_id', v_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Overload dengan parameter UUID untuk kompatibilitas
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
    RETURN public.admin_delete_user(target_user_id::TEXT);
END;
$$;

-- Berikan izin eksekusi kepada role anon, authenticated, dan service_role
GRANT EXECUTE ON FUNCTION public.admin_delete_user(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO anon, authenticated, service_role;

-- Pasang DELETE policy pada public.profiles untuk RLS PostgREST
DROP POLICY IF EXISTS "Profiles deletable by admin" ON public.profiles;

CREATE POLICY "Profiles deletable by admin"
ON public.profiles FOR DELETE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'pembina')
);
