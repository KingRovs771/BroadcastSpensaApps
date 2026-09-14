-- =====================================================================
-- Migration: 20260914000001_admin_user_crud_policies.sql
-- Full CRUD policies and helper RPCs for user accounts management
-- =====================================================================

-- 1. DELETE policy on public.profiles
DROP POLICY IF EXISTS "Profiles deletable by admin" ON public.profiles;

CREATE POLICY "Profiles deletable by admin"
ON public.profiles FOR DELETE
TO authenticated
USING (public.get_current_role() = 'administrator');

-- 2. UPDATE policy on public.profiles (allow self, administrator, or pembina)
DROP POLICY IF EXISTS "Profiles updatable by self or admin" ON public.profiles;

CREATE POLICY "Profiles updatable by self or admin"
ON public.profiles FOR UPDATE
TO authenticated
USING (
    auth.uid() = id
    OR public.get_current_role() IN ('administrator', 'pembina')
);

-- 3. RPC to delete user profile safely
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF public.get_current_role() <> 'administrator' THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Administrator yang berhak menghapus akun pengguna.';
    END IF;

    IF target_user_id = auth.uid() THEN
        RAISE EXCEPTION 'Tidak dapat menghapus akun Anda sendiri yang sedang aktif.';
    END IF;

    DELETE FROM public.profiles WHERE id = target_user_id;
    RETURN TRUE;
END;
$$;

-- 4. RPC to update user profile safely
CREATE OR REPLACE FUNCTION public.admin_update_user(
    target_user_id UUID,
    new_nama VARCHAR,
    new_role VARCHAR,
    new_divisi VARCHAR DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF public.get_current_role() <> 'administrator' AND public.get_current_role() <> 'pembina' THEN
        RAISE EXCEPTION 'Akses ditolak: Hanya Administrator dan Pembina yang berhak mengedit akun pengguna.';
    END IF;

    UPDATE public.profiles
    SET
        nama = new_nama,
        role = new_role,
        divisi = new_divisi,
        updated_at = NOW()
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'id', target_user_id,
        'nama', new_nama,
        'role', new_role,
        'divisi', new_divisi
    );
END;
$$;
