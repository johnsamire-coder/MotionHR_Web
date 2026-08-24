import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const qs = searchParams.toString();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: authHeader, Host: "jssolutions-eg.com" },
      cache: "no-store",
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: "Backend error", detail: text.substring(0, 200) }, { status: 500 }); }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/`, {
      method: "POST",
      headers: { Authorization: authHeader, "Content-Type": "application/json", Host: "jssolutions-eg.com" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: "Backend error", detail: text.substring(0, 200) }, { status: 500 }); }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/`, {
      method: "PUT",
      headers: { Authorization: authHeader, "Content-Type": "application/json", Host: "jssolutions-eg.com" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: "Backend error", detail: text.substring(0, 200) }, { status: 500 }); }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/departments/${id ? `?id=${id}` : ""}`, {
      method: "DELETE",
      headers: { Authorization: authHeader, "Content-Type": "application/json", Host: "jssolutions-eg.com" },
    });
    const text = await res.text();
    try { return NextResponse.json(JSON.parse(text), { status: res.status }); }
    catch { return NextResponse.json({ error: "Backend error", detail: text.substring(0, 200) }, { status: 500 }); }
  } catch (e) {
    return NextResponse.json({ error: "Network error", detail: String(e) }, { status: 500 });
  }
}