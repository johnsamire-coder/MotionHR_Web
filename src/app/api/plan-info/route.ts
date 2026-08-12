import { NextResponse } from "next/server";
const BACKEND = "https://jssolutions-eg.com";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/subscriptions/api/trial-plan-info/`, {
      headers: { "Host": "jssolutions-eg.com" },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json({ max_employees: 5, trial_days: 14 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ max_employees: 5, trial_days: 14 });
  }
}
