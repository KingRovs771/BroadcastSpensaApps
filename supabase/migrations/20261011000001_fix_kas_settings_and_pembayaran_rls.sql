-- Migration: 20261011000001_fix_kas_settings_and_pembayaran_rls.sql
-- Description: Allow Ketua Broadcast, Bendahara, and Admin to manage kas_settings and kas_pembayaran

-- 1. Kas Settings RLS
DROP POLICY IF EXISTS "Kas Settings editable only by Ketua Broadcast & Admin" ON public.kas_settings;
DROP POLICY IF EXISTS "Kas Settings editable by Ketua, Bendahara & Admin" ON public.kas_settings;

CREATE POLICY "Kas Settings editable by Ketua, Bendahara & Admin"
ON public.kas_settings FOR ALL TO authenticated
USING (
    public.get_current_role() IN ('ketua_broadcast', 'bendahara', 'administrator')
)
WITH CHECK (
    public.get_current_role() IN ('ketua_broadcast', 'bendahara', 'administrator')
);

-- 2. Kas Pembayaran RLS
DROP POLICY IF EXISTS "Kas Pembayaran editable by Bendahara & Admin" ON public.kas_pembayaran;
DROP POLICY IF EXISTS "Kas Pembayaran editable by Bendahara, Ketua & Admin" ON public.kas_pembayaran;

CREATE POLICY "Kas Pembayaran editable by Bendahara, Ketua & Admin"
ON public.kas_pembayaran FOR ALL TO authenticated
USING (
    public.get_current_role() IN ('bendahara', 'ketua_broadcast', 'administrator')
)
WITH CHECK (
    public.get_current_role() IN ('bendahara', 'ketua_broadcast', 'administrator')
);
