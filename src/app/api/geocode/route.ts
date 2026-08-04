import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q");
  if (!q) return NextResponse.json([], { status: 200 });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&addressdetails=1&countrycodes=eg&viewbox=24.7,31.6,36.9,22.0&bounded=1`,
      {
        headers: {
          "User-Agent": "MotionHR/1.0",
          "Accept-Language": "ar",
        },
      }
    );
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
