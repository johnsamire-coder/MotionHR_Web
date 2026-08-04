import { NextResponse } from "next/server";

const BACKEND = "https://jssolutions-eg.com";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const headers = {
    Authorization: authHeader,
    "Accept-Language": "ar",
  };

  try {
    const [team, attendance, pending, missions] = await Promise.all([
      fetch(`${BACKEND}/attendance/api/mobile/manager/employees/`, { headers, cache: "no-store" }).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND}/attendance/api/mobile/manager/reports/daily-attendance/?date=${today}`, { headers, cache: "no-store" }).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND}/attendance/api/mobile/manager/pending/`, { headers, cache: "no-store" }).then(r => r.json()).catch(() => null),
      fetch(`${BACKEND}/attendance/api/mobile/manager/missions/`, { headers, cache: "no-store" }).then(r => r.json()).catch(() => null),
    ]);

    return NextResponse.json({
      today,
      year,
      month,
      team_size: team?.count || 0,
      present_today: attendance?.stats?.present || 0,
      absent_today: attendance?.stats?.absent || 0,
      late_today: attendance?.stats?.late || 0,
      pending_requests: pending?.total_pending || 0,
      active_missions: missions?.count || 0,
    });
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
