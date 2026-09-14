import { NextRequest, NextResponse } from "next/server";
import { deleteUserSchema } from "@/lib/validations/user";
import { createServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = deleteUserSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi data gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { targetUserId } = result.data;
    const serverClient = createServer();
    const { data: { user } } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." },
        { status: 400 }
      );
    }

    // Ambil detail profil yang akan dihapus untuk audit log
    let targetName = "Pengguna";
    let targetEmail = "";
    let targetRole = "anggota";
    const { data: targetProfile } = await serverClient
      .from("profiles")
      .select("nama, email, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetProfile) {
      targetName = targetProfile.nama || targetProfile.email;
      targetEmail = targetProfile.email;
      targetRole = targetProfile.role;
    }

    let deletionSuccessful = false;
    let failureDetail = "";

    // ── STRATEGI 1: Panggil RPC admin_delete_user (PostgreSQL Function) ────────
    try {
      const { data: rpcData, error: rpcError } = await serverClient.rpc("admin_delete_user", {
        target_identifier: targetUserId,
      });

      if (!rpcError && rpcData) {
        const parsed = typeof rpcData === "string" ? JSON.parse(rpcData) : rpcData;
        if (parsed.success) {
          deletionSuccessful = true;
        } else if (parsed.error) {
          failureDetail = parsed.error;
        }
      } else if (rpcError) {
        // Coba signature kedua dengan target_user_id (UUID)
        const { data: rpcData2, error: rpcError2 } = await serverClient.rpc("admin_delete_user", {
          target_user_id: targetUserId,
        });
        if (!rpcError2 && rpcData2) {
          const parsed2 = typeof rpcData2 === "string" ? JSON.parse(rpcData2) : rpcData2;
          if (parsed2.success) {
            deletionSuccessful = true;
          } else if (parsed2.error) {
            failureDetail = parsed2.error;
          }
        } else {
          failureDetail = rpcError2?.message || rpcError.message;
        }
      }
    } catch (rpcEx: any) {
      failureDetail = rpcEx?.message || "RPC admin_delete_user exception";
    }

    // ── STRATEGI 2: Supabase Auth Admin Service Role (jika tersedia) ─────────────
    if (
      !deletionSuccessful &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key" &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20
    ) {
      try {
        const adminClient = createAdminClient();
        // Hapus dari profiles
        await adminClient.from("profiles").delete().eq("id", targetUserId);
        // Hapus dari auth.users
        const { error: authDelErr } = await adminClient.auth.admin.deleteUser(targetUserId);
        if (!authDelErr) {
          deletionSuccessful = true;
        } else {
          failureDetail = authDelErr.message;
        }
      } catch (adminErr: any) {
        failureDetail = adminErr?.message || "Admin delete exception";
      }
    }

    // ── STRATEGI 3: Direct PostgREST Delete dengan verifikasi .select() ─────────
    if (!deletionSuccessful) {
      try {
        const { data: deletedRows, error: postgrestErr } = await serverClient
          .from("profiles")
          .delete()
          .eq("id", targetUserId)
          .select("id");

        if (!postgrestErr && deletedRows && deletedRows.length > 0) {
          deletionSuccessful = true;
        } else if (postgrestErr) {
          failureDetail = postgrestErr.message;
        }
      } catch (pgErr: any) {
        failureDetail = pgErr?.message || "PostgREST delete exception";
      }
    }

    // Jika semua strategi gagal menghapus baris dari database
    if (!deletionSuccessful) {
      return NextResponse.json(
        {
          error:
            "Akun belum berhasil dihapus dari database. " +
            (failureDetail ? `(Penyebab: ${failureDetail}). ` : "") +
            "Pastikan query SQL migrasi 'admin_delete_user' telah dijalankan di Supabase SQL Editor.",
          needsMigration: true,
          targetUserId,
        },
        { status: 422 }
      );
    }

    // Catat ke tabel audit_log jika deletion berhasil
    try {
      await serverClient.from("audit_log").insert({
        actor_id: user.id,
        actor_role: user.user_metadata?.role || "administrator",
        divisi: user.user_metadata?.divisi ?? null,
        action: "DELETE_USER",
        target_table: "profiles",
        target_id: targetUserId.length === 36 ? targetUserId : null,
        extra_json: {
          actor_name: user.user_metadata?.nama || user.email,
          details: `Menghapus akun pengguna secara permanen: ${targetName} (${targetRole})`,
          target_email: targetEmail,
        },
      });
    } catch {
      // audit log fail-safe
    }

    return NextResponse.json({
      success: true,
      message: `Akun ${targetName} berhasil dihapus permanen dari sistem.`,
      targetUserId,
    });
  } catch (err: unknown) {
    console.error("Error in users/delete route:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat memproses penghapusan akun pengguna." },
      { status: 500 }
    );
  }
}
