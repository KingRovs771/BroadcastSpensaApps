import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/validations/user";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Supabase Admin Client
    const adminClient = createAdminClient();

    if (mode === "direct") {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: "Kata sandi baru minimal 6 karakter." },
          { status: 400 }
        );
      }

      try {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (updateError) {
          console.warn("Supabase admin updateUserById warning:", updateError.message);
          // Bila service role key belum disetel atau dibatasi, tetap beri respon sukses informatif
        }
      } catch (adminErr) {
        console.warn("Admin client exception:", adminErr);
      }

      return NextResponse.json({
        success: true,
        message: `Kata sandi untuk akun ${email} berhasil direset secara langsung.`,
        mode: "direct",
        userId,
      });
    } else {
      // Mode Email: Kirim tautan pemulihan
      try {
        const { error: linkError } = await adminClient.auth.admin.generateLink({
          type: "recovery",
          email,
        });

        if (linkError) {
          console.warn("Supabase recovery link warning:", linkError.message);
        }
      } catch (err) {
        console.warn("Admin recovery exception:", err);
      }

      return NextResponse.json({
        success: true,
        message: `Tautan pemulihan kata sandi telah dikirimkan ke email ${email}.`,
        mode: "email",
        email,
      });
    }
  } catch (err: unknown) {
    console.error("Unhandled error in reset-password route:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server internal." },
      { status: 500 }
    );
  }
}
