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
    const { data: targetProfile } = await serverClient
      .from("profiles")
      .select("nama, email, role")
      .eq("id", targetUserId)
      .maybeSingle();

    if (targetProfile) {
      targetName = targetProfile.nama || targetProfile.email;
    }

    // 1. Coba hapus via Supabase Auth Admin jika service role key ada
    let deletedViaAdmin = false;
    if (
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
    ) {
      try {
        const adminClient = createAdminClient();
        const { error: authDelErr } = await adminClient.auth.admin.deleteUser(targetUserId);
        if (!authDelErr) {
          deletedViaAdmin = true;
        } else {
          console.warn("admin.deleteUser warning:", authDelErr.message);
        }
      } catch (adminErr) {
        console.warn("admin delete exception:", adminErr);
      }
    }

    // 2. Hapus atau pastikan baris di public.profiles terhapus
    const { error: profileDelErr } = await serverClient
      .from("profiles")
      .delete()
      .eq("id", targetUserId);

    if (profileDelErr && !deletedViaAdmin) {
      // Coba panggil RPC admin_delete_user
      const { error: rpcErr } = await serverClient.rpc("admin_delete_user", {
        target_user_id: targetUserId,
      });

      if (rpcErr) {
        return NextResponse.json(
          { error: profileDelErr.message || rpcErr.message || "Gagal menghapus pengguna dari basis data." },
          { status: 403 }
        );
      }
    }

    // 3. Catat ke tabel audit_log
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
          details: `Menghapus akun pengguna: ${targetName} (${targetProfile?.role || "anggota"})`,
          target_email: targetProfile?.email,
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Akun ${targetName} berhasil dihapus dari sistem.`,
      targetUserId,
    });
  } catch (err: unknown) {
    console.error("Error in users/delete route:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat menghapus akun pengguna." },
      { status: 500 }
    );
  }
}
