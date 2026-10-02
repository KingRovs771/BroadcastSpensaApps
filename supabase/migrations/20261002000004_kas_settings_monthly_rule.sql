-- =====================================================================
-- Migration: 20261002000004_kas_settings_monthly_rule.sql
-- Description: Expand kas_settings.periode_type to include 'bulanan'
-- =====================================================================

DO $$
BEGIN
    -- Drop old check constraint if exists
    ALTER TABLE public.kas_settings DROP CONSTRAINT IF EXISTS kas_settings_periode_type_check;

    -- Add updated check constraint allowing 'bulanan'
    ALTER TABLE public.kas_settings ADD CONSTRAINT kas_settings_periode_type_check 
        CHECK (periode_type IN ('mingguan', 'dwimingguan', 'bulanan'));
END $$;
