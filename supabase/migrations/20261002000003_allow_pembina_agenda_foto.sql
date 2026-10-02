-- =====================================================================
-- Migration: 20261002000003_allow_pembina_agenda_foto.sql
-- Description: Mengizinkan Pembina, Sekretaris, Ketua Broadcast, dan Admin
--              untuk menambahkan Agenda Foto / Rekor Lomba Dokumentasi
-- =====================================================================

ALTER TABLE public.agenda_foto ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agenda Foto insert by Sekretaris & Admin" ON public.agenda_foto;
DROP POLICY IF EXISTS "Agenda Foto insert by authorized roles" ON public.agenda_foto;

CREATE POLICY "Agenda Foto insert by authorized roles"
ON public.agenda_foto FOR INSERT
TO authenticated
WITH CHECK (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'sekretaris', 'ketua_broadcast')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'sekretaris', 'ketua_broadcast')
);

DROP POLICY IF EXISTS "Agenda Foto update status by Ketua Fotografer" ON public.agenda_foto;
DROP POLICY IF EXISTS "Agenda Foto update by authorized roles" ON public.agenda_foto;

CREATE POLICY "Agenda Foto update by authorized roles"
ON public.agenda_foto FOR UPDATE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'ketua_broadcast')
    OR (public.get_current_role() = 'ketua_divisi' AND public.get_current_divisi() = 'Fotografer')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'ketua_broadcast')
    OR ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ketua_divisi' AND (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Fotografer')
);

DROP POLICY IF EXISTS "Agenda Foto delete by authorized roles" ON public.agenda_foto;

CREATE POLICY "Agenda Foto delete by authorized roles"
ON public.agenda_foto FOR DELETE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'sekretaris')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'sekretaris')
);
