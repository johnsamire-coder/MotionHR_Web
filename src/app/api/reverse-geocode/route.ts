import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ display_name: "" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=ar`,
      {
        headers: {
          "User-Agent": "MotionHR/1.0",
          "Accept-Language": "ar",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ display_name: "" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({
      display_name: data?.display_name || "",
      address: data?.address || null,
    });
  } catch {
    return NextResponse.json({ display_name: "" }, { status: 500 });
  }
}
