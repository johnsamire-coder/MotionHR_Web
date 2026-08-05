import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // 1) نجيب السياسة الأصلية
    const getRes = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/attendance-policy/${id}/`,
      {
        headers: {
          Authorization: authHeader,
          "Host": "jssolutions-eg.com",
        },
        cache: "no-store",
      }
    );
    const getData = await getRes.json();
    if (!getData.policy) {
      return NextResponse.json({ error: "Policy not found" }, { status: 404 });
    }

    const p = getData.policy;
    // 2) نعمل نسخة جديدة كـ draft
    const newPolicy = {
      name: `${p.name} (${lang === "ar" ? "نسخة" : "Copy"})`,
      effective_from: new Date().toISOString().split("T")[0],
      effective_to: null,
      status: "draft",
      notes: p.notes || "",
      permission_enabled: p.permission_enabled,
      permission_monthly_hours: p.permission_monthly_hours,
      permission_monthly_count: p.permission_monthly_count,
      permission_max_hours_per_request: p.permission_max_hours_per_request,
      permission_fraction_as_full: p.permission_fraction_as_full,
      permission_reset_cycle: p.permission_reset_cycle,
    };

    const createRes = await fetch(
      `${BACKEND}/attendance/api/mobile/manager/attendance-policy/`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
          "Host": "jssolutions-eg.com",
        },
        body: JSON.stringify(newPolicy),
      }
    );
    return NextResponse.json(await createRes.json(), { status: createRes.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
