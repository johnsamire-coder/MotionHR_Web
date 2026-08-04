import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/request-types/`, {
      headers: {
        Authorization: authHeader,
        "Accept-Language": lang,
        "Host": "jssolutions-eg.com",
      },
      cache: "no-store",
    });
    return NextResponse.json(await res.json(), { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const lang = request.headers.get("accept-language") || "ar";
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { request_type_id, form_data, subject: bodySubject, details: bodyDetails } = body;

    // ── بناء subject و details من form_data ──────────────
    const formData = form_data || {};

    // subject = اسم الحقل الأول المملوء أو "طلب"
    let subject = bodySubject || "";
    let details = bodyDetails || "";

    if (!subject) {
      const subjectKeys = ["reason", "purpose", "topic", "complaint_details",
                           "request_details", "suggestion", "target_entity"];
      for (const k of subjectKeys) {
        if (formData[k]) { subject = String(formData[k]).slice(0, 100); break; }
      }
    }
    if (!subject) subject = "طلب";

    if (!details) {
      // details = كل القيم مجموعة
      details = Object.entries(formData)
        .filter(([, v]) => v !== null && v !== undefined && v !== "")
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
    }
    if (!details) details = subject;

    const payload = {
      request_type_id,
      subject,
      details,
      form_data: formData,
      // حقول إضافية من form_data
      amount:          formData.amount        || undefined,
      start_date:      formData.start_date    || undefined,
      end_date:        formData.end_date      || undefined,
      permission_date: formData.permission_date || undefined,
      permission_time: formData.permission_time || undefined,
      duration_hours:  formData.duration_hours  || undefined,
      priority:        formData.priority || "normal",
    };

    // نحذف الـ undefined
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );

    const res = await fetch(`${BACKEND}/attendance/api/mobile/submit-request/`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        "Accept-Language": lang,
        "Host": "jssolutions-eg.com",
      },
      body: JSON.stringify(cleanPayload),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
