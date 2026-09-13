import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/user";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parseResult = resetPasswordSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Payload tidak valid",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { userId, email, newPassword, mode } = parseResult.data;
    const cleanEmail = email.trim().toLowerCase();

    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      "";

    const publicClient = createClient(supabaseUrl, supabaseAnonKey);

    const hasServiceRoleKey = Boolean(
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20
    );

    // =========================================================================
    // MODE 1: Penetapan Kata Sandi Langsung (Direct Password Update)
    // =========================================================================
    if (mode === "direct") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      let directSuccess = false;
      let directErrorMsg = "";

      // ── Strategi A: Supabase Auth GoTrue Admin API (jika service role key ada)
      if (hasServiceRoleKey) {
        try {
          const adminClient = createAdminClient();
          let targetAuthId = userId;

          // Periksa apakah userId valid UUID
          const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAuthId);

          if (!isUUID) {
            // Cari user ID di Auth berdasarkan email
            const { data: listData } = await adminClient.auth.admin.listUsers();
            const foundUser = listData?.users?.find(
              (u) => u.email?.toLowerCase() === cleanEmail
            );
            if (foundUser) {
              targetAuthId = foundUser.id;
            }
          }

          const { error: updateError } = await adminClient.auth.admin.updateUserById(
            targetAuthId,
            {
              password: newPassword,
              email_confirm: true,
            }
          );

          if (!updateError) {
            directSuccess = true;
          } else {
            directErrorMsg = updateError.message;
            console.warn("admin.updateUserById notice:", updateError.message);
          }
        } catch (adminErr: any) {
          directErrorMsg = adminErr?.message || "Gagal pada Supabase Admin API";
          console.warn("admin.updateUserById exception:", adminErr);
        }
      }

      // ── Strategi B: PostgreSQL Function RPC (admin_reset_password)
      if (!directSuccess) {
        try {
          const { data: rpcData, error: rpcError } = await publicClient.rpc(
            "admin_reset_password",
            {
              target_email: cleanEmail,
              new_password: newPassword,
            }
          );

          if (!rpcError && rpcData) {
            const parsed = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
            if (parsed.success) {
              directSuccess = true;
            } else if (parsed.error) {
              directErrorMsg = parsed.error;
            }
          } else if (rpcError) {
            console.warn("RPC admin_reset_password notice:", rpcError.message);
            if (!directErrorMsg) directErrorMsg = rpcError.message;
          }
        } catch (rpcEx: any) {
          console.warn("RPC exception:", rpcEx);
          if (!directErrorMsg) directErrorMsg = rpcEx?.message;
        }
      }

      if (directSuccess) {
        return NextResponse.json({
          success: true,
          message: `Kata sandi untuk akun ${cleanEmail} berhasil diperbarui. Pengguna dapat langsung login dengan kata sandi baru.`,
          mode: "direct",
          email: cleanEmail,
        });
      }

      // Jika kedua strategi belum berhasil
      return NextResponse.json(
        {
          error:
            "Reset kata sandi langsung belum dapat diproses oleh database. " +
            (directErrorMsg ? `(Detail: ${directErrorMsg}). ` : "") +
            "Pastikan query SQL migrasi 'admin_reset_password' telah dijalankan di Supabase SQL Editor, atau tambahkan SUPABASE_SERVICE_ROLE_KEY di .env.local.",
          needsMigration: true,
        },
        { status: 422 }
      );
    }

    // =========================================================================
    // MODE 2: Kirim Tautan Pemulihan Kata Sandi ke Email (Email Link Mode)
    // =========================================================================
    try {
      const origin = request.nextUrl.origin || "http://localhost:3000";
      const { error: resetEmailError } = await publicClient.auth.resetPasswordForEmail(
        cleanEmail,
        {
          redirectTo: `${origin}/login`,
        }
      );

      if (resetEmailError) {
        return NextResponse.json(
          {
            error: `Gagal mengirim tautan reset email: ${resetEmailError.message}`,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Tautan pemulihan kata sandi telah dikirimkan ke email ${cleanEmail}. Harap minta pengguna memeriksa kotak masuk atau folder spam.`,
        mode: "email",
        email: cleanEmail,
      });
    } catch (emailErr: any) {
      console.error("Error sending reset password email:", emailErr);
      return NextResponse.json(
        {
          error: emailErr?.message || "Gagal mengirimkan email pemulihan kata sandi.",
        },
        { status: 500 }
      );
    }
  } catch (err: unknown) {
    console.error("Unhandled error in reset-password route:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server internal." },
      { status: 500 }
    );
  }
}
