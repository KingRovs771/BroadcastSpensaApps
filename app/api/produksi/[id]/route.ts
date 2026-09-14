import { NextRequest, NextResponse } from "next/server";
import { createServer } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServer();
    const { data: prod, error } = await supabase
      .from("produksi_video")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();

    if (error || !prod) {
      return NextResponse.json({ error: "Produksi tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ data: prod });
  } catch {
    return NextResponse.json({ error: "Gagal memuat data produksi" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const supabase = createServer();
    const { data, error } = await supabase
      .from("produksi_video")
      .update(body)
      .eq("id", params.id)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Produksi berhasil diperbarui",
      data,
    });
  } catch {
    return NextResponse.json(
      { error: "Payload tidak valid" },
      { status: 400 }
    );
  }
}
