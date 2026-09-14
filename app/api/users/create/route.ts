import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      nama,
      role = "pembina",
      nip,
      jabatan,
      no_hp,
      divisi,
    } = body;

    if (!email || !password || !nama) {
      return NextResponse.json(
        { error: "Nama, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanNama = nama.trim();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === "placeholder-service-key") {
      return NextResponse.json(
        { error: "Service role key belum dikonfigurasi di server.", fallbackToClient: true },
        { status: 503 }
      );
    }

    const adminClient = createAdminClient();

    // 1. Buat user via Supabase Auth Admin dengan email_confirm: true (TANPA VERIFIKASI EMAIL)
    const { data: authUser, error: authError } =
      await adminClient.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true, // Auto-confirm: Pengguna langsung aktif tanpa cek email
        user_metadata: {
          nama: cleanNama,
          role,
          nip: nip?.trim() || undefined,
          jabatan: jabatan?.trim() || undefined,
          no_hp: no_hp?.trim() || undefined,
          divisi: divisi || undefined,
        },
      });

    if (authError) {
      if (authError.message.includes("User already registered") || authError.message.includes("already exists")) {
        return NextResponse.json(
          { error: "Email ini sudah terdaftar di sistem. Gunakan email lain." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message, fallbackToClient: true },
        { status: 400 }
      );
    }

    if (!authUser?.user?.id) {
      return NextResponse.json(
        { error: "Gagal membuat user di auth.users.", fallbackToClient: true },
        { status: 500 }
      );
    }

    const userId = authUser.user.id;

    // 2. Simpan atau pastikan profil ada di public.profiles
    const { error: profileError } = await adminClient.from("profiles").upsert(
      {
        id: userId,
        nama: cleanNama,
        email: cleanEmail,
        role,
        divisi: (role === "div_kreatif" || role === "ketua_divisi" || role === "pj") ? divisi : null,
      },
      { onConflict: "id" }
    );

    if (profileError) {
      console.warn("Profil auto-insert notice via admin:", profileError.message);
    }

    return NextResponse.json({
      success: true,
      message: `Akun ${cleanNama} (${role}) berhasil dibuat dan langsung aktif tanpa verifikasi email.`,
      user: {
        id: userId,
        nama: cleanNama,
        email: cleanEmail,
        role,
        divisi,
      },
    });
  } catch (err: unknown) {
    console.error("Unhandled error in users/create route:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat membuat akun pengguna." },
      { status: 500 }
    );
  }
}
