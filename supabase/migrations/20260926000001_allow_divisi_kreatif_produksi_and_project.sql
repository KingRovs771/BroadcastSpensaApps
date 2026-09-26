-- =====================================================================
-- Migration: 20260926000001_allow_divisi_kreatif_produksi_and_project.sql
-- Allow all members in Divisi Kreatif to insert scripts / concept questions
-- and create / update projects on the Kanban board.
-- =====================================================================

-- 1. PRODUKSI VIDEO RLS
ALTER TABLE public.produksi_video ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Produksi insert by Kreatif, Ketua Divisi, Admin" ON public.produksi_video;
DROP POLICY IF EXISTS "Produksi insert by Kreatif, Ketua Divisi, Admin, Pembina" ON public.produksi_video;
DROP POLICY IF EXISTS "Produksi insert by all authorized roles" ON public.produksi_video;

CREATE POLICY "Produksi insert by Kreatif, Ketua Divisi, Admin"
ON public.produksi_video FOR INSERT
TO authenticated
WITH CHECK (
    public.get_current_role() IN ('div_kreatif', 'ketua_divisi', 'administrator', 'admin', 'pembina', 'ketua_broadcast')
    OR public.get_current_divisi() = 'Kreatif'
    OR (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Kreatif'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('div_kreatif', 'ketua_divisi', 'administrator', 'admin', 'pembina', 'ketua_broadcast')
);

-- 2. PROJECT KANBAN RLS
ALTER TABLE public.project ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project editable by Ketua Broadcast, Admin, PJ" ON public.project;
DROP POLICY IF EXISTS "Project insert policy" ON public.project;
DROP POLICY IF EXISTS "Project update policy" ON public.project;
DROP POLICY IF EXISTS "Project all policy" ON public.project;

-- Allow INSERT by Ketua Broadcast, Admin, Pembina, and ALL members in Divisi Kreatif
CREATE POLICY "Project insert policy"
ON public.project FOR INSERT
TO authenticated
WITH CHECK (
    public.get_current_role() IN ('ketua_broadcast', 'administrator', 'admin', 'pembina', 'div_kreatif')
    OR public.get_current_divisi() = 'Kreatif'
    OR (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Kreatif'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ketua_broadcast', 'administrator', 'admin', 'pembina', 'div_kreatif')
);

-- Allow UPDATE by Ketua Broadcast, Admin, Pembina, members in Divisi Kreatif, or assigned PJ / team members
CREATE POLICY "Project update policy"
ON public.project FOR UPDATE
TO authenticated
USING (
    public.get_current_role() IN ('ketua_broadcast', 'administrator', 'admin', 'pembina', 'div_kreatif')
    OR public.get_current_divisi() = 'Kreatif'
    OR (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Kreatif'
    OR auth.uid() = penanggung_jawab
    OR auth.uid() = ANY(tim)
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ketua_broadcast', 'administrator', 'admin', 'pembina', 'div_kreatif')
)
WITH CHECK (
    public.get_current_role() IN ('ketua_broadcast', 'administrator', 'admin', 'pembina', 'div_kreatif')
    OR public.get_current_divisi() = 'Kreatif'
    OR (SELECT divisi FROM public.profiles WHERE id = auth.uid()) = 'Kreatif'
    OR auth.uid() = penanggung_jawab
    OR auth.uid() = ANY(tim)
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('ketua_broadcast', 'administrator', 'admin', 'pembina', 'div_kreatif')
);
