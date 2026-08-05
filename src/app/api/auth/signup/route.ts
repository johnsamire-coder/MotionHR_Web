import { NextResponse } from "next/server";
const B = "https://jssolutions-eg.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${B}/subscriptions/api/trial-signup/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Host": "jssolutions-eg.com",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try {
      return NextResponse.json(JSON.parse(text), { status: res.status });
    } catch {
      return NextResponse.json({ error: text.substring(0, 200) }, { status: 500 });
    }
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
