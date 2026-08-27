import { NextRequest, NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("motionhr_token")?.value || 
                        request.cookies.get("token")?.value || 
                        request.cookies.get("auth_token")?.value;
                        
    const token = authHeader?.replace("Token ", "")?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let url = `${BACKEND}/attendance/api/mobile/manager/payroll/summary/`;
    const params = new URLSearchParams();
    if (year) params.append("year", year);
    if (month) params.append("month", month);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Token ${token}`,
        "Accept-Language": "ar",
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ error: "Backend error" }, { status: 500 });
  }
}
