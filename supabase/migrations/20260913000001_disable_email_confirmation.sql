-- =====================================================================
-- Broadcast Spensa OS - Migration: Disable Email Confirmation
-- Otomatis konfirmasi seluruh akun di auth.users (Tanpa perlu verifikasi email)
-- =====================================================================

-- 1. Konfirmasi seketika seluruh akun yang telah terdaftar
-- Catatan: confirmed_at adalah GENERATED COLUMN di Supabase Auth,
-- sehingga hanya email_confirmed_at yang perlu di-update.
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 2. Fungsi trigger auto-confirm untuk setiap user baru di auth.users
CREATE OR REPLACE FUNCTION public.auto_confirm_new_user()
RETURNS TRIGGER AS $$
BEGIN
    NEW.email_confirmed_at = COALESCE(NEW.email_confirmed_at, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Pasang trigger sebelum baris baru masuk ke auth.users
DROP TRIGGER IF EXISTS trigger_auto_confirm_new_user ON auth.users;

CREATE TRIGGER trigger_auto_confirm_new_user
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.auto_confirm_new_user();
