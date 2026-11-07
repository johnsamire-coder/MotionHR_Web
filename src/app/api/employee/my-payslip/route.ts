import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") === "en" ? "en" : "ar";
    const query = searchParams.toString();
    const url = `${BACKEND}/attendance/api/mobile/employee/payslip/${query ? `?${query}` : ""}`;

    const res = await fetch(url, {
      headers: { Authorization: authHeader, "Accept-Language": lang },
      cache: "no-store",
    });

    // ?export=pdf: السيرفر بيرجّع ملف PDF، بنبعته زي ما هو
    const type = res.headers.get("content-type") || "";
    if (res.ok && type.includes("application/pdf")) {
      return new NextResponse(await res.arrayBuffer(), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": res.headers.get("content-disposition") || 'attachment; filename="payslip.pdf"',
        },
      });
    }
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
