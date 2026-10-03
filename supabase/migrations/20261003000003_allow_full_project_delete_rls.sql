-- =====================================================================
-- Migration: 20261003000003_allow_full_project_delete_rls.sql
-- Description: Mengizinkan DELETE project kanban untuk peran pengelola:
--   - administrator / admin
--   - pembina
--   - ketua_broadcast
--   - ketua_divisi
--   - sekretaris
--   - div_kreatif atau divisi = 'Kreatif'
--   - penanggung_jawab project
--   - anggota tim yang terdaftar di project
-- =====================================================================

ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project delete policy" ON public.project;

CREATE POLICY "Project delete policy"
ON public.project FOR DELETE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'ketua_broadcast', 'ketua_divisi', 'sekretaris', 'div_kreatif')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'ketua_broadcast', 'ketua_divisi', 'sekretaris', 'div_kreatif')
    OR public.get_current_divisi() = 'Kreatif'
    OR (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Kreatif'
    OR auth.uid() = penanggung_jawab
    OR auth.uid() = ANY(tim)
);
