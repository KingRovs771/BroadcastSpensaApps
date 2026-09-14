import { NextRequest, NextResponse } from "next/server";
import { updateUserSchema } from "@/lib/validations/user";
import { createServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = updateUserSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi data gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { targetUserId, nama, role, divisi } = result.data;
    const finalDivisi =
      role === "div_kreatif" || role === "ketua_divisi" || role === "pj"
        ? divisi || null
        : null;

    // 1. Coba update via admin client jika service key ada
    let updatedViaAdmin = false;
    if (
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY !== "placeholder-service-key"
    ) {
      try {
        const adminClient = createAdminClient();
        const { error: profErr } = await adminClient
          .from("profiles")
          .update({
            nama: nama.trim(),
            role,
            divisi: finalDivisi,
            updated_at: new Date().toISOString(),
          })
          .eq("id", targetUserId);

        if (!profErr) {
          updatedViaAdmin = true;
          // Sync auth user metadata
          await adminClient.auth.admin.updateUserById(targetUserId, {
            user_metadata: {
              nama: nama.trim(),
              role,
              divisi: finalDivisi,
            },
          });
        }
      } catch (err) {
        console.warn("Admin update notice, continuing with user session:", err);
      }
    }

    // 2. Fallback via server session client
    if (!updatedViaAdmin) {
      const serverClient = createServer();
      const { error: serverErr } = await serverClient
        .from("profiles")
        .update({
          nama: nama.trim(),
          role,
          divisi: finalDivisi,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetUserId);

      if (serverErr) {
        // Coba via RPC admin_update_user
        const { error: rpcErr } = await serverClient.rpc("admin_update_user", {
          target_user_id: targetUserId,
          new_nama: nama.trim(),
          new_role: role,
          new_divisi: finalDivisi,
        });

        if (rpcErr) {
          return NextResponse.json(
            { error: serverErr.message || rpcErr.message || "Gagal mengedit profil pengguna." },
            { status: 403 }
          );
        }
      }
    }

    // 3. Catat ke audit log
    try {
      const serverClient = createServer();
      const { data: { user } } = await serverClient.auth.getUser();
      if (user) {
        await serverClient.from("audit_log").insert({
          actor_id: user.id,
          actor_role: user.user_metadata?.role || "administrator",
          divisi: user.user_metadata?.divisi ?? null,
          action: "UPDATE_USER",
          target_table: "profiles",
          target_id: targetUserId.length === 36 ? targetUserId : null,
          extra_json: {
            actor_name: user.user_metadata?.nama || user.email,
            details: `Mengubah akun ${nama} (Role: ${role}, Divisi: ${finalDivisi || "-"})`,
            updated_fields: { nama, role, divisi: finalDivisi },
          },
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Akun ${nama} berhasil diperbarui.`,
      data: {
        id: targetUserId,
        nama: nama.trim(),
        role,
        divisi: finalDivisi,
      },
    });
  } catch (err: unknown) {
    console.error("Error in users/update route:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server saat memperbarui akun pengguna." },
      { status: 500 }
    );
  }
}
