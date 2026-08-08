import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = req.headers.get("authorization") || "";
  const res = await fetch(
    `${BACKEND}/attendance/api/mobile/manager/shifts/override/${id}/delete/`,
    { method: "DELETE", headers: { Authorization: auth } }
  );
  return NextResponse.json(await res.json());
}
