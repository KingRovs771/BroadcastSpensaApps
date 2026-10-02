-- =====================================================================
-- Migration: 20261002000001_allow_pembina_manage_anggota.sql
-- Allow Pembina, Sekretaris & Administrator to Manage Anggota
-- =====================================================================

-- 1. Update RLS Policy on public.anggota
DROP POLICY IF EXISTS "Anggota editable by Sekretaris & Admin" ON public.anggota;
DROP POLICY IF EXISTS "Anggota editable by Sekretaris, Pembina & Admin" ON public.anggota;

CREATE POLICY "Anggota editable by Sekretaris, Pembina & Admin"
ON public.anggota FOR ALL
TO authenticated
USING (public.get_current_role() IN ('sekretaris', 'administrator', 'pembina'));
