import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const BACKEND = "https://jssolutions-eg.com";

async function proxyRequest(
  request: Request,
  method: "GET" | "PUT" | "PATCH" | "DELETE",
  id: string
) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    let body: string | undefined = undefined;
    if (method === "PUT" || method === "PATCH") {
      body = JSON.stringify(await request.json());
    }

    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/insurance-policies/${id}/`, {
      method,
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Accept-Language": lang,
      },
      ...(body ? { body } : {}),
      cache: "no-store",
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { success: res.ok, message: text };
    }
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, "GET", id);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, "PUT", id);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, "PATCH", id);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return proxyRequest(request, "DELETE", id);
}
