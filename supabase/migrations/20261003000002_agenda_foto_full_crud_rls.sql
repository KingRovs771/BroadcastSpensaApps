-- =====================================================================
-- Migration: 20261003000002_agenda_foto_full_crud_rls.sql
-- Description: Full CRUD RLS for public.agenda_foto
-- Roles authorized for C, U, D:
--   - administrator / admin
--   - pembina
--   - ketua_broadcast
--   - sekretaris
--   - ketua_divisi (Fotografer)
-- Read: Viewable by all authenticated users
-- =====================================================================

ALTER TABLE public.agenda_foto ENABLE ROW LEVEL SECURITY;

-- 1. SELECT (Read)
DROP POLICY IF EXISTS "Agenda Foto viewable by all" ON public.agenda_foto;
CREATE POLICY "Agenda Foto viewable by all"
ON public.agenda_foto FOR SELECT
TO authenticated
USING (true);

-- 2. INSERT (Create)
DROP POLICY IF EXISTS "Agenda Foto insert by authorized roles" ON public.agenda_foto;
DROP POLICY IF EXISTS "Agenda Foto insert by Sekretaris & Admin" ON public.agenda_foto;
CREATE POLICY "Agenda Foto insert by authorized roles"
ON public.agenda_foto FOR INSERT
TO authenticated
WITH CHECK (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'sekretaris', 'ketua_broadcast')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'sekretaris', 'ketua_broadcast')
    OR (public.get_current_role() = 'ketua_divisi' AND public.get_current_divisi() = 'Fotografer')
    OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ketua_divisi' AND (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Fotografer')
);

-- 3. UPDATE (Edit & Status Toggle)
DROP POLICY IF EXISTS "Agenda Foto update by authorized roles" ON public.agenda_foto;
DROP POLICY IF EXISTS "Agenda Foto update status by Ketua Fotografer" ON public.agenda_foto;
CREATE POLICY "Agenda Foto update by authorized roles"
ON public.agenda_foto FOR UPDATE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'ketua_broadcast', 'sekretaris')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'ketua_broadcast', 'sekretaris')
    OR (public.get_current_role() = 'ketua_divisi' AND public.get_current_divisi() = 'Fotografer')
    OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ketua_divisi' AND (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Fotografer')
);

-- 4. DELETE (Delete with confirmation)
DROP POLICY IF EXISTS "Agenda Foto delete by authorized roles" ON public.agenda_foto;
CREATE POLICY "Agenda Foto delete by authorized roles"
ON public.agenda_foto FOR DELETE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'sekretaris', 'ketua_broadcast')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'sekretaris', 'ketua_broadcast')
    OR (public.get_current_role() = 'ketua_divisi' AND public.get_current_divisi() = 'Fotografer')
    OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ketua_divisi' AND (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Fotografer')
);
