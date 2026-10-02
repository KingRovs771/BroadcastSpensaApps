-- =====================================================================
-- Migration: 20261002000002_project_delete_policy.sql
-- Description: Menambahkan policy DELETE pada tabel public.project untuk
--              administrator, pembina, ketua_broadcast, ketua_divisi, dan PJ
-- =====================================================================

ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project delete policy" ON public.project;

CREATE POLICY "Project delete policy"
ON public.project FOR DELETE
TO authenticated
USING (
    public.get_current_role() IN ('administrator', 'admin', 'pembina', 'ketua_broadcast', 'ketua_divisi')
    OR auth.uid() = penanggung_jawab
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('administrator', 'admin', 'pembina', 'ketua_broadcast', 'ketua_divisi')
);
