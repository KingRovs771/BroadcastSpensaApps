import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email pengguna wajib disertakan." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const adminClient = createAdminClient();

    // 1. Cari user di Supabase Auth Admin
    const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();

    if (listError) {
      console.warn("List users error during auto-confirm:", listError.message);
    }

    const targetUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (targetUser) {
      // 2. Set email_confirm = true secara langsung tanpa verifikasi email
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        targetUser.id,
        { email_confirm: true }
      );

      if (updateError) {
        console.warn("updateUserById email_confirm error:", updateError.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Akun ${cleanEmail} telah diverifikasi otomatis tanpa verifikasi email.`,
      email: cleanEmail,
    });
  } catch (err: unknown) {
    console.error("Unhandled auto-confirm error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat konfirmasi akun." },
      { status: 500 }
    );
  }
}
