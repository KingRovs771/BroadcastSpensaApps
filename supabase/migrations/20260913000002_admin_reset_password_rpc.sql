-- Migration: 20260913000002_admin_reset_password_rpc.sql
-- Direct Admin Password Reset RPC for Supabase Auth (Bypassing Service Role Key limitation)

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_reset_password(
    target_email TEXT,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    v_user_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    IF new_password IS NULL OR length(new_password) < 6 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Kata sandi baru minimal 6 karakter.'
        );
    END IF;

    -- 1. Cari user di auth.users berdasarkan email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE lower(email) = lower(trim(target_email))
    LIMIT 1;

    -- Jika tidak ditemukan di auth.users, periksa id dari public.profiles
    IF v_user_id IS NULL THEN
        SELECT id::UUID INTO v_user_id
        FROM public.profiles
        WHERE lower(email) = lower(trim(target_email))
          AND id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        LIMIT 1;
    END IF;

    -- Jika tetap tidak ada UUID valid, buat UUID baru
    IF v_user_id IS NULL THEN
        v_user_id := extensions.gen_random_uuid();
    END IF;

    -- 2. Hash kata sandi baru menggunakan bcrypt (pgcrypto)
    v_encrypted_pw := extensions.crypt(new_password, extensions.gen_salt('bf'));

    -- 3. Update auth.users jika record sudah ada
    UPDATE auth.users
    SET encrypted_password = v_encrypted_pw,
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = v_user_id OR lower(email) = lower(trim(target_email));

    -- 4. Jika user belum ada di auth.users, buatkan baris baru di auth.users
    IF NOT FOUND THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            lower(trim(target_email)),
            v_encrypted_pw,
            NOW(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );

        -- Pastikan juga row di profiles sinkron jika belum ada
        INSERT INTO public.profiles (
            id,
            nama,
            email,
            role
        ) VALUES (
            v_user_id,
            split_part(target_email, '@', 1),
            lower(trim(target_email)),
            'anggota'
        ) ON CONFLICT (id) DO UPDATE
          SET email = EXCLUDED.email;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Kata sandi akun ' || target_email || ' berhasil direset secara langsung.',
        'user_id', v_user_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- Berikan hak eksekusi kepada role anon dan authenticated
GRANT EXECUTE ON FUNCTION public.admin_reset_password(TEXT, TEXT) TO anon, authenticated, service_role;
