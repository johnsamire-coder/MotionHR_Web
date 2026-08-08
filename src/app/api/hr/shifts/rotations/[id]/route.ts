import { NextRequest, NextResponse } from "next/server";
const BACKEND = process.env.NEXT_PUBLIC_API_BASE || "https://jssolutions-eg.com";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = req.headers.get("authorization") || "";
  const body = await req.json();
  const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/rotations/${id}/`, {
    method: "PUT",
    headers: { Authorization: auth, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json());
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = req.headers.get("authorization") || "";
  const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/rotations/${id}/`, {
    method: "DELETE",
    headers: { Authorization: auth },
  });
  return NextResponse.json(await res.json());
}
