import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
const BACKEND = "https://jssolutions-eg.com";

async function proxy(request: Request, method: "GET" | "PUT" | "PATCH" | "DELETE", id: string) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    let body: string | undefined;
    if (method === "PUT" || method === "PATCH") body = JSON.stringify(await request.json());
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/payroll-cycle-policies/${id}/`, {
      method,
      headers: { Authorization: authHeader, "Content-Type": "application/json", "Accept-Language": "ar" },
      ...(body ? { body } : {}),
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(request, "GET", id);
}
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(request, "PUT", id);
}
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(request, "PATCH", id);
}
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxy(request, "DELETE", id);
}
