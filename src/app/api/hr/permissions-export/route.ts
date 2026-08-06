import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const format = searchParams.get("format") || "pdf";

  if (!type) {
    return NextResponse.json({ error: "type is required (role/user/company)" }, { status: 400 });
  }

  try {
    const url = new URL(`${BACKEND}/attendance/api/mobile/manager/permissions/export/`);
    url.searchParams.set("type", type);
    if (id) url.searchParams.set("id", id);
    url.searchParams.set("format", format);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Authorization: authHeader },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text || "Export failed" }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || (format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const blob = await res.arrayBuffer();

    const ext = format === "pdf" ? "pdf" : "xlsx";
    const filename = `permissions_${type}${id ? `_${id}` : ""}_${Date.now()}.${ext}`;

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Network error" }, { status: 500 });
  }
}
