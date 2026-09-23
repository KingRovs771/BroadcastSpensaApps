-- =====================================================================
-- Migration: 20260923000002_fix_keuangan_pembina_rls_and_crud.sql
-- Fix Keuangan Pembina RLS Visibility and Enable Full CRUD for Admin & Pembina
-- =====================================================================

ALTER TABLE public.keuangan_pembina ENABLE ROW LEVEL SECURITY;

-- 1. Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "Keuangan Pembina viewable only by privileged roles" ON public.keuangan_pembina;
DROP POLICY IF EXISTS "Keuangan Pembina editable exclusively by Pembina and Admin" ON public.keuangan_pembina;
DROP POLICY IF EXISTS "Keuangan Pembina select policy" ON public.keuangan_pembina;
DROP POLICY IF EXISTS "Keuangan Pembina insert policy" ON public.keuangan_pembina;
DROP POLICY IF EXISTS "Keuangan Pembina update policy" ON public.keuangan_pembina;
DROP POLICY IF EXISTS "Keuangan Pembina delete policy" ON public.keuangan_pembina;

-- 2. SELECT Policy: Privileged roles (Pembina, Administrator, Admin, Ketua Broadcast, Bendahara)
CREATE POLICY "Keuangan Pembina select policy"
ON public.keuangan_pembina FOR SELECT
TO authenticated
USING (
    public.get_current_role() IN ('pembina', 'ketua_broadcast', 'bendahara', 'administrator', 'admin')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('pembina', 'ketua_broadcast', 'bendahara', 'administrator', 'admin')
);

-- 3. INSERT Policy: Pembina & Administrator/Admin
CREATE POLICY "Keuangan Pembina insert policy"
ON public.keuangan_pembina FOR INSERT
TO authenticated
WITH CHECK (
    public.get_current_role() IN ('pembina', 'administrator', 'admin')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('pembina', 'administrator', 'admin')
);

-- 4. UPDATE Policy: Pembina & Administrator/Admin (Full edit capability)
CREATE POLICY "Keuangan Pembina update policy"
ON public.keuangan_pembina FOR UPDATE
TO authenticated
USING (
    public.get_current_role() IN ('pembina', 'administrator', 'admin')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('pembina', 'administrator', 'admin')
)
WITH CHECK (
    public.get_current_role() IN ('pembina', 'administrator', 'admin')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('pembina', 'administrator', 'admin')
);

-- 5. DELETE Policy: Pembina & Administrator/Admin (Full delete capability)
CREATE POLICY "Keuangan Pembina delete policy"
ON public.keuangan_pembina FOR DELETE
TO authenticated
USING (
    public.get_current_role() IN ('pembina', 'administrator', 'admin')
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('pembina', 'administrator', 'admin')
);
