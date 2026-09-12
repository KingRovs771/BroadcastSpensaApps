-- =====================================================================
-- Migration: 20260912000001_allow_admin_manage_profiles.sql
-- Allow Administrators to insert and manage user profiles in public.profiles
-- =====================================================================

DROP POLICY IF EXISTS "Profiles insertable by authenticated" ON public.profiles;

CREATE POLICY "Profiles insertable by authenticated"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
    OR public.get_current_role() = 'administrator'
);
