import { NextRequest, NextResponse } from "next/server";
import { projectDeleteSchema } from "@/lib/validations/project";
import { createServer } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = projectDeleteSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validasi data gagal", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { projectId } = result.data;
    const serverClient = createServer();
    const {
      data: { user },
    } = await serverClient.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Tidak terautentikasi. Silakan masuk terlebih dahulu." },
        { status: 401 }
      );
    }

    // 1. Ambil data profil pengguna yang sedang login
    const { data: profile } = await serverClient
      .from("profiles")
      .select("id, nama, role, divisi")
      .eq("id", user.id)
      .maybeSingle();

    const userRole = profile?.role || "anggota";
    const userDivisi = profile?.divisi || null;

    // 2. Ambil data project yang ingin dihapus
    const adminClient = createAdminClient();
    const { data: project, error: fetchErr } = await adminClient
      .from("project")
      .select("id, nama_project, penanggung_jawab, tim, divisi")
      .eq("id", projectId)
      .maybeSingle();

    if (fetchErr || !project) {
      return NextResponse.json(
        { error: "Project tidak ditemukan atau sudah dihapus." },
        { status: 404 }
      );
    }

    // 3. Evaluasi hak akses (Zero-Trust Security)
    const isPrivilegedRole = [
      "administrator",
      "admin",
      "pembina",
      "ketua_broadcast",
      "ketua_divisi",
      "sekretaris",
      "div_kreatif",
    ].includes(userRole);

    const isKreatifDivisi = userDivisi === "Kreatif" || project.divisi === userDivisi;
    const isPJ = project.penanggung_jawab === user.id;
    const isTeamMember = Array.isArray(project.tim) && project.tim.includes(user.id);

    if (!isPrivilegedRole && !isKreatifDivisi && !isPJ && !isTeamMember) {
      return NextResponse.json(
        { error: "Akses ditolak: Anda tidak memiliki wewenang untuk menghapus agenda project ini." },
        { status: 403 }
      );
    }

    // 4. Eksekusi penghapusan via adminClient (memastikan eksekusi aman & tuntas di Supabase Cloud)
    const { error: delErr } = await adminClient
      .from("project")
      .delete()
      .eq("id", projectId);

    if (delErr) {
      console.error("Gagal menghapus project:", delErr);
      return NextResponse.json(
        { error: `Gagal menghapus project dari database: ${delErr.message}` },
        { status: 500 }
      );
    }

    // 5. Rekam ke tabel audit_log
    try {
      await adminClient.from("audit_log").insert({
        actor_id: user.id,
        actor_role: userRole,
        divisi: userDivisi,
        action: "DELETE_PROJECT",
        target_table: "project",
        target_id: projectId,
        extra_json: {
          actor_name: profile?.nama || user.email,
          project_nama: project.nama_project,
          deleted_at: new Date().toISOString(),
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Project "${project.nama_project}" berhasil dihapus secara permanen.`,
    });
  } catch (err: unknown) {
    console.error("Error project delete route:", err);
    const msg = err instanceof Error ? err.message : "Terjadi kesalahan internal server.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
