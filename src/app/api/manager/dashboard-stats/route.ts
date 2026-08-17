import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND}/attendance/api/mobile/manager/dashboard/`, {
      headers: { Authorization: authHeader },
      cache: "no-store",
    });
    const data = await res.json();

    const pulse = data?.pulse || {};
    const decisions = data?.decisions || {};

    return NextResponse.json({
      team_size: pulse.total_employees || 0,
      present_today: pulse.present || 0,
      absent_today: pulse.absent || 0,
      late_today: pulse.late || 0,
      on_leave_today: pulse.on_leave || 0,
      attendance_rate: pulse.attendance_rate || 0,
      pending_requests: decisions.pending_requests || 0,
      pending_leaves: decisions.pending_leaves || 0,
      active_missions: 0,
    });
  } catch {
    return NextResponse.json({
      team_size: 0, present_today: 0, absent_today: 0,
      late_today: 0, on_leave_today: 0, attendance_rate: 0,
      pending_requests: 0, pending_leaves: 0, active_missions: 0,
    });
  }
}
