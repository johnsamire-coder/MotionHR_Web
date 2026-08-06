import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "";
    const userId = searchParams.get("user_id") || "";

    let url = `${BACKEND}/attendance/api/mobile/manager/permissions/defaults/`;
    if (role) url += `?role=${role}`;

    const res = await fetch(url, {
      headers: { Authorization: authHeader, "Accept-Language": "ar" },
      cache: "no-store",
    });

    const data = await res.json();

    if (userId) {
      const userRes = await fetch(
        `${BACKEND}/attendance/api/mobile/manager/permissions/users/${userId}/`,
        { headers: { Authorization: authHeader, "Accept-Language": "ar" }, cache: "no-store" }
      );
      const userData = await userRes.json();
      return NextResponse.json({ ...data, overrides: userData?.overrides || [] });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
