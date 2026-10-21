import { NextRequest, NextResponse } from "next/server";
import { todayCairo } from "@/lib/utils";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const asOfDate = searchParams.get("as_of_date") || todayCairo();

  try {
    const url = `${BACKEND}/attendance/api/mobile/manager/reports/eos/export/pdf/?as_of_date=${encodeURIComponent(asOfDate)}`;
    const res = await fetch(url, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Backend error" }, { status: res.status });
    }

    const fileBuffer = await res.arrayBuffer();
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="eos_report_${asOfDate}.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
