import { NextRequest, NextResponse } from "next/server";
import { INITIAL_PRODUKSI } from "@/lib/mock/store";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const prod = INITIAL_PRODUKSI.find((p) => p.id === params.id);
  if (!prod) {
    return NextResponse.json({ error: "Produksi tidak ditemukan" }, { status: 404 });
  }
  return NextResponse.json({ data: prod });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      message: "Produksi berhasil diperbarui",
      data: { id: params.id, ...body },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: "Payload tidak valid" },
      { status: 400 }
    );
  }
}
