import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // نجرب الـ endpoint بتاع الموظف الأول لأنه بيرجع balances
    const url = `${BACKEND}/attendance/api/mobile/leave-types/`;
    const res = await fetch(url, {
      headers: {
        Authorization: authHeader,
        "Accept-Language": "ar",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // fallback لـ hr endpoint
      const url2 = `${BACKEND}/attendance/api/mobile/hr/leave-types/`;
      const res2 = await fetch(url2, {
        headers: {
          Authorization: authHeader,
          "Accept-Language": "ar",
        },
        cache: "no-store",
      });
      if (!res2.ok) {
        return NextResponse.json({ error: "Backend error" }, { status: res2.status });
      }
      const data2 = await res2.json();
      return NextResponse.json(data2);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
