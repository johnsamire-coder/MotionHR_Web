import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = new URL(request.url);
  const params = url.searchParams.toString();
  try {
    const res = await fetch(
      `${BACKEND}/attendance/api/mobile/employee/payslip/${params ? "?" + params : ""}`,
      {
        headers: {
          Authorization: authHeader,
          "Accept-Language": lang,
          "Host": "jssolutions-eg.com",
        },
        cache: "no-store",
      }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
