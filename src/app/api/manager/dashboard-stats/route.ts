import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const today = new Date().toISOString().split("T")[0];
    const [empRes, attRes] = await Promise.all([
      fetch(`${BACKEND}/attendance/api/mobile/manager/employees/`, {
        headers: { Authorization: authHeader }, cache: "no-store",
      }),
      fetch(`${BACKEND}/attendance/api/mobile/manager/attendance/?date=${today}`, {
        headers: { Authorization: authHeader }, cache: "no-store",
      }),
    ]);
    const empData = await empRes.json();
    const attData = await attRes.json();

    const employees = empData?.employees || [];
    const records = attData?.records || attData || [];

    const present = records.filter((r: { status_code?: string }) =>
      r.status_code === "present" || r.status_code === "late"
    ).length;
    const absent = records.filter((r: { status_code?: string }) =>
      r.status_code === "absent"
    ).length;
    const late = records.filter((r: { status_code?: string }) =>
      r.status_code === "late"
    ).length;

    return NextResponse.json({
      team_size: employees.length,
      present_today: present,
      absent_today: absent,
      late_today: late,
      active_missions: 0,
    });
  } catch {
    return NextResponse.json({ team_size: 0, present_today: 0, absent_today: 0, late_today: 0, active_missions: 0 });
  }
}
