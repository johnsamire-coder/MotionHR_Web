import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/charters/${id}/update/`, {
      method: "PUT",
      headers: { Authorization: authHeader },
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
